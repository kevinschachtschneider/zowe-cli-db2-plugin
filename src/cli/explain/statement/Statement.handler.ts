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

import { AbstractSession, ICommandHandler, IHandlerParameters, ImperativeError, TextUtils } from "@zowe/imperative";
import { ExplainStatement, IDB2Session, DB2BaseHandler } from "../../../index";
import * as fs from "fs";

/**
 * Command handler for executing of SQL queries
 * @export
 * @class SQLHandler
 * @implements {ICommandHandler}
 */
export default class StatementHandler extends DB2BaseHandler {
    public async processWithDB2Session(params: IHandlerParameters, session: AbstractSession): Promise<void> {
        const DB2session = session.ISession as IDB2Session;

        const query: string = params.arguments.query;
        const commit: boolean = params.arguments.commit;
        const sqlid: string = params.arguments.sqlid;

        const explainer = new ExplainStatement(DB2session);

        const response = explainer.explain(query, commit, sqlid);

        // // Return as an object when using --response-format-json
        // params.response.data.setObj(responses);

    }
}
