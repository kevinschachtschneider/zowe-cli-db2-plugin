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

import { ICommandDefinition } from "@zowe/imperative";

export const StatementDefinition: ICommandDefinition = {
    name: "statement",
    aliases: ["stmt"],
    type: "command",
    summary: "Issue an EXPLAIN for an explainable statement",
    description: "Issue an EXPLAIN for an explainable statement." +
    "EXPLAIN tables created with the current SQLID of the connection. All existing EXPLAIN"+
    "tables standardized to the format of the current Db2 version and missing EXPLAIN tables created."+
    "By default, creation of EXPLAIN tables is rolled back. To commit changes use commit option (-c).",
    handler: __dirname + "/Statement.handler",
    profile: {
        optional: ["db2"]
    },
    options: [
        {
            name: "query",
            aliases: ["q"],
            type: "string",
            description: "The explainable statement",
        },
        {
            name: "commit",
            aliases: ["c"],
            type: "boolean",
            description: "Commit rows and changes to explain tables",
        },
        {
            name: "sqlid",
            aliases: ["id"],
            type: "string",
            description: "SQLID to use (creator of explain tables)",
        }
    ],
    examples: [
        {
            description: "Get access path information for query",
            options: "-q \"SELECT * FROM SAMPLE.EMP\"",
        }
    ],
    mustSpecifyOne: ["query"],
};
