/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

class TreeNode {
    public data: any;
    public left: TreeNode;
    public right: TreeNode;

    constructor(data: any, left: TreeNode, right: TreeNode) {
        this.data = data;
        this.left = left;
        this.right = right;
    }
}

export function visualize(stuff: any) {
    try {
        const stuffArray = stuff.PLAN_TABLE
        ;
        const qBlockArray = new Array();
        let currentQBlockNo = stuffArray[0].QBLOCKNO;
        let tree: any;
        let qBlockArrayIndex = 0;

        for (const thing of stuffArray) {
            if (thing.QBLOCKNO !== currentQBlockNo) {
                qBlockArrayIndex = thing.QBLOCKNO;
                qBlockArrayIndex++;
            }

            if (qBlockArray.length < qBlockArrayIndex + 1) {
                const newArray = new Array<any>();
                newArray.push(thing);
                qBlockArray.push(newArray);
            } else {
                qBlockArray[qBlockArrayIndex].push(thing);
            }
        }

        let currentNode = new TreeNode(qBlockArray[0].shift(), null, null);
        currentQBlockNo = currentNode.data.QBLOCKNO;

        const methodThree = 3;

        if (currentNode.data.METHOD === methodThree && currentNode.data.QBLOCK_TYPE === "UNION") {
            const unionArray = new Array<TreeNode>();
            for (const qBlockArrayMember of qBlockArray) {
                currentNode = new TreeNode(qBlockArrayMember.shift(), null, null);
                if (currentNode.data.METHOD === methodThree) {
                    createNextTreeNode(currentNode, [qBlockArrayMember], 1);
                }
                else {
                    createNextTreeNode(currentNode, [qBlockArrayMember], 2);
                }
                unionArray.push(currentNode);
            }
            tree = {
                UNION: unionArray
            };
        }
        else {
            createNextTreeNode(currentNode, qBlockArray, 2);
            tree = currentNode;
        }
        const util = require("util");
        console.log(util.inspect(tree, {showHidden: false, depth: null})); // tslint:disable-line
    }
    catch (err) {
        console.log(err); // tslint:disable-line
    }

}

function createNextTreeNode(currentNode: TreeNode, qBlockArray: any[][], numberOfChildren: number) {
    while (qBlockArray.length > 0 && qBlockArray[0].length === 0) {
        qBlockArray.shift();
    }

    const methodZero = 0;
    const methodThree = 3;
    const childrenNodes = [];

    for (let i = 0; i < numberOfChildren && childrenNodes.length < 2; i++) {
        let nextNode: TreeNode;
        if (qBlockArray.length > 0 && qBlockArray[0].length > 0) {
            const nextQBlock = qBlockArray[0].shift();
            nextNode = new TreeNode(nextQBlock, null, null);

            if (nextQBlock.METHOD === methodZero) {
                if (nextQBlock.TABLE_TYPE === "W") {
                    const workFileQBlockNumber = extractWorkFileQBlockNumber(nextQBlock.TNAME);
                    let workFileQBlockArray;
                    for (let j = 1; j < qBlockArray.length; j++) {
                        if (workFileQBlockNumber === qBlockArray[j][0].QBLOCKNO) {
                            workFileQBlockArray = qBlockArray[j];
                            qBlockArray = qBlockArray.splice(j, 1);
                            break;
                        }
                    }

                    if (workFileQBlockArray != null) {
                        createNextTreeNode(nextNode, [workFileQBlockArray], 1);
                    }
                }
            } else if (nextQBlock.METHOD === methodThree) {
                createNextTreeNode(nextNode, qBlockArray, 1);
            } else {
                // if (nextQBlock.TABLE_TYPE === "W") {
                //     const workFileQBlockNumber = extractWorkFileQBlockNumber(nextQBlock.TNAME);
                //     let workFileQBlockArray;
                //     for (let j = 1; j < qBlockArray.length; j++) {
                //         if (workFileQBlockNumber === qBlockArray[j][0].QBLOCKNO) {
                //             workFileQBlockArray = qBlockArray[j];
                //             qBlockArray = qBlockArray.splice(j, 1);
                //             break;
                //         }
                //     }

                //     if(childrenNodes.length > 0){
                //         const leftNode = new TreeNode(childrenNodes.shift(), null, null);
                //         createNextTreeNode(leftNode, qBlockArray, 2);
                //         nextNode.left = leftNode;
                //     }
                //     else if(qBlockArray[0].length > 0){
                //         const leftNode = new TreeNode(qBlockArray[0].shift(), null, null);
                //         createNextTreeNode(leftNode, qBlockArray, 2);
                //         nextNode.left = leftNode;
                //     }

                //     if (workFileQBlockArray != null) {
                //         createNextTreeNode(nextNode, [workFileQBlockArray], 1);
                //     }
                // }
                // else{
                nextNode.left = new TreeNode(nextNode.data.TNAME, null, null);
                createNextTreeNode(nextNode, qBlockArray, 1);
                // }
            }
            childrenNodes.push(nextNode);
        }
    }

    if (childrenNodes.length === 1) {
        currentNode.right = childrenNodes[0];
    }
    else if (childrenNodes.length === 2) {
        currentNode.left = childrenNodes[0];
        currentNode.right = childrenNodes[1];
    }
}

function extractWorkFileQBlockNumber(tableName: string): number {
    return parseInt(tableName.split("(")[1].split(")")[0], 10);
}
