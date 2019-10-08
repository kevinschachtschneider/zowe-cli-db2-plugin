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

import { ConnectionString, DB2Constants, IDB2Parameter, IDB2Session,
    SessionValidator, DB2Error } from "../";
import * as ibmdb from "ibm_db";

/**
 * Class to handle explain of a SQL statement
 * @export
 * @class ExplainStatement
 */
export class ExplainStatement {

    /**
     * Connection to a DB2 region
     * @type {ibmdb.Database}
     * @memberof ExportTable
     * @private
     */
    private mConnection: ibmdb.Database;

    /**
     * The connection string to use with ODBC driver
     * @type {string}
     * @memberof ExportTable
     * @private
     */
    private readonly mConnectionString: string;

    private readonly explainStatements = {
        PLAN_TABLE : `
            SELECT QBLOCKNO, PLANNO, QBLOCK_TYPE, METHOD, TNAME, TABLE_TYPE
            FROM PLAN_TABLE
            WHERE EXPLAIN_TIME BETWEEN ? AND ?
            ORDER BY QUERYNO, QBLOCKNO, PLANNO DESC
            `
    };

    /**
     * Constructor
     * @param {IDB2Session} session DB2 session parameters
     */
    constructor(session: IDB2Session) {
        SessionValidator.validate(session);
        this.mConnectionString = ConnectionString.buildFromSession(session);
    }

    /**
     * Explain a SQL statement
     * @param {string} sql Statement to explain
     * @param {IDB2Parameter[]} parameters Array of DB2 parameters to bind to the SQL statement
     * @returns {IterableIterator<any>}
     * @static
     * @memberof ExplainStatement
     */
    public explain(sql: string, parameters?: IDB2Parameter[]): any {
        const options = {
            fetchMode: DB2Constants.FETCH_MODE_OBJECT,
        };
        let result;
        try {
            this.mConnection = ibmdb.openSync(this.mConnectionString, options);
            const beginTimestamp = this.getCurrentTimestamp();
            this.mConnection.querySync("EXPLAIN PLAN FOR " + sql, parameters);
            const endTimestamp = this.getCurrentTimestamp();

            result = this.mConnection.queryResultSync(this.explainStatements.PLAN_TABLE, [beginTimestamp, endTimestamp]);
            const planTableRows = result.fetchAllSync();
            if (result instanceof Error) {
                throw result;
            }
            result.closeSync();

            this.mConnection.closeSync();
            return { PLAN_TABLE : planTableRows };
        }
        catch (err) {
            DB2Error.process(err);
        }
    }

    /**
     * Get CURRENT TIMESTAMP
     * @returns {string}
     * @static
     * @memberof ExplainStatement
     */
    private getCurrentTimestamp(): string {
        // TODO: check or comment or somthing for this.mConnection not open
        const result = this.mConnection.queryResultSync("SELECT CURRENT TIMESTAMP FROM SYSIBM.SYSDUMMY1");
        const timestamp = result.fetchAllSync(); // We have to fetchAll b/c of a misdefined type in @types package
        result.closeSync();
        return timestamp[0][1];
    }
}
