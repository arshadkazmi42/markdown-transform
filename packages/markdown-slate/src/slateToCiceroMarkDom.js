/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const NS = 'org.accordproject.commonmark';
const NS_CICERO = 'org.accordproject.ciceromark';

/**
 * Converts a Slate document node to CiceroMark DOM (as JSON)
 * @param {*} document the Slate document node
 * @returns {*} the CiceroMark DOM as a Concerto object
 */
function slateToCiceroMarkDom(document) {

    const result = {
        $class : 'org.accordproject.commonmark.Document',
        xmlns : 'http://commonmark.org/xml/1.0',
        nodes : []
    };
    // convert the value to a plain object
    const json = JSON.parse(JSON.stringify(document));
    _recursive(result, json.nodes);
    return result;
}

/**
 * Converts an array of Slate nodes, pushing them into the parent
 * @param {*} parent the parent CiceroMark DOM node
 * @param {*} nodes an array of Slate nodes
 */
function _recursive(parent, nodes) {

    nodes.forEach((node, index) => {
        let result = null;

        switch (node.object) {
        case 'text':
            result = handleText(node);
            break;
        default:
            switch(node.type) {
            case 'clause':
                // console.log(JSON.stringify(node, null, 4));
                result = {$class : `${NS_CICERO}.Clause`, clauseid: node.data.clauseid, src: node.data.src, clauseText: node.data.clauseText, nodes: []};
                break;
            case 'variable':
                result = {$class : `${NS_CICERO}.Variable`, id: node.data.id, value: node.data.value, nodes: []};
                break;
            case 'computed':
                result = {$class : `${NS_CICERO}.ComputedVariable`, value: node.data.value, nodes: []};
                break;
            case 'paragraph':
                result = {$class : `${NS}.Paragraph`, nodes: []};
                break;
            case 'quote':
                result = {$class : `${NS}.BlockQuote`};
                break;
            case 'horizontal_rule':
                result = {$class : `${NS}.ThematicBreak`};
                break;
            case 'heading_one':
                result = {$class : `${NS}.Heading`, level : '1', nodes: []};
                break;
            case 'heading_two':
                result = {$class : `${NS}.Heading`, level : '2', nodes: []};
                break;
            case 'heading_three':
                result = {$class : `${NS}.Heading`, level : '3', nodes: []};
                break;
            case 'heading_four':
                result = {$class : `${NS}.Heading`, level : '4', nodes: []};
                break;
            case 'heading_five':
                result = {$class : `${NS}.Heading`, level : '5', nodes: []};
                break;
            case 'heading_six':
                result = {$class : `${NS}.Heading`, level : '6', nodes: []};
                break;
            case 'block_quote':
                result = {$class : `${NS}.BlockQuote`, nodes: []};
                break;
            case 'code_block':
                result = {$class : `${NS}.CodeBlock`, text: node.text};
                break;
            case 'html_block':
                result = {$class : `${NS}.HtmlBlock`, text: node.text};
                break;
            case 'html_inline':
                result = {$class : `${NS}.HtmlInline`};
                break;
            case 'ol_list':
            case 'ul_list':
                result = {$class : `${NS}.List`, type: node.type === 'ol_list' ? 'ordered' : 'bullet', delimiter: node.data.delimiter, start: node.data.start, tight: node.data.tight, nodes: []};
                break;
            case 'list_item':
                result = {$class : `${NS}.Item`, nodes: []};
                result.nodes.push({$class : `${NS}.Paragraph`, nodes: []});
                break;
            case 'link': {
                result = {$class : `${NS}.Link`, destination: node.data.href, title: '', nodes: []};
                break;
            }
            }
        }

        if(!result) {
            throw Error(`Failed to process node ${JSON.stringify(node)}`);
        }

        // process any children, attaching to first child if it exists (for list items)
        if(node.nodes && result.nodes) {
            _recursive(result.nodes[0] ? result.nodes[0] : result, node.nodes);
        }

        if(!parent.nodes) {
            throw new Error(`Parent node doesn't have children ${JSON.stringify(parent)}`);
        }
        parent.nodes.push(result);
    });
}

/**
 * Handles a text node
 * @param {*} node the slate text node
 * @returns {*} the ast node
 */
function handleText(node) {

    let strong = null;
    let emph = null;
    let result = null;

    const isBold = node.marks.some(mark => mark.type === 'bold');
    const isItalic = node.marks.some(mark => mark.type === 'italic');
    const isCode = node.marks.some(mark => mark.type === 'code');

    if (isCode) {
        return {$class : `${NS}.Code`, text: node.text};
    }

    const text = {
        $class : `${NS}.Text`,
        text : node.text
    };

    if (isBold) {
        strong = {$class : `${NS}.Strong`, nodes: []};
    }

    if (isItalic) {
        emph  = {$class : `${NS}.Emph`, nodes: []};
    }

    if(strong && emph) {
        result = emph;
        emph.nodes.push(strong);
        strong.nodes.push(text);
    }
    else {
        if(strong) {
            result = strong;
            strong.nodes.push(text);
        }

        if(emph) {
            result = emph;
            emph.nodes.push(text);
        }
    }

    if(!result) {
        result = text;
    }

    return result;
}

module.exports = slateToCiceroMarkDom;