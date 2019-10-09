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
import { DB2_PARM_OUTPUT, DB2_PARM_INPUT } from "./doc/IDB2Parameter";

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
            // Create or update existing explain tables
            // TODO: if schema not set by user get from connection
            const schema = this.getCurrentSQLID();
            this.callAdminExplainMaint(schema);

            // Get beginning timestamp for timeslice of Explain Tables
            const beginTimestamp = this.getCurrentTimestamp();

            // Execute EXPLAIN statement for given explainable statement
            this.mConnection.querySync("EXPLAIN PLAN FOR " + sql, parameters);

            // Get ending timestamp for timeslice of Explain Tables
            const endTimestamp = this.getCurrentTimestamp();

            // Get rows from Explain Tables for timeslice
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
        const result = this.mConnection.queryResultSync("SELECT CURRENT TIMESTAMP FROM SYSIBM.SYSDUMMY1");
        const timestamp = result.fetchAllSync(); // We have to fetchAll b/c of a misdefined type in @types package
        result.closeSync();
        return timestamp[0][1];
    }

    /**
     * Get CURRENT SQLID TODO make this generic with TIMESTAMP
     * @returns {string}
     * @static
     * @memberof ExplainStatement
     */
    private getCurrentSQLID(): string {
        const result = this.mConnection.queryResultSync("SELECT CURRENT SQLID FROM SYSIBM.SYSDUMMY1");
        const sqlid = result.fetchAllSync(); // We have to fetchAll b/c of a misdefined type in @types package
        result.closeSync();
        return sqlid[0][1];
    }

    /**
     * Create or upgrade explain tables
     *
     */
    private callAdminExplainMaint(schema: string) {
        const query: string = "CALL SYSPROC.ADMIN_EXPLAIN_MAINT(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const parameters: IDB2Parameter[] = [
            {ParamType: DB2_PARM_INPUT, Data: "RUN"}, // option: mode. Alters and creates Explain tables.
            {ParamType: DB2_PARM_INPUT, Data: "STANDARDIZE_AND_CREATE"}, // option: action. Updates all EXPL tbls to the current DB2 format.
            {ParamType: DB2_PARM_INPUT, Data: "NO"}, // option: manage-alias. Specifies whether to create aliases for EXPLAIN tables.
            {ParamType: DB2_PARM_INPUT, Data: "DIAGNOSTICS"}, // option: table-set. Specifies the list of tables to be created.
            {ParamType: DB2_PARM_INPUT, Data: schema}, // option: authid. The CURRENT SQLID setting.
            {ParamType: DB2_PARM_INPUT, Data: schema}, // option: schema-name. The schema name that qualifies the EXPLAIN tables.
            {ParamType: DB2_PARM_INPUT, Data: "NULL"},// option: schema-alias. Required only if manage-alias is set to YES.
            {ParamType: DB2_PARM_INPUT, Data: "DSNDB04"},// option: database-name. Database that contains new Explain tables.
            {ParamType: DB2_PARM_INPUT, Data: "NULL"},// option:stogroup-database. Stogroup to store database.
            {ParamType: DB2_PARM_INPUT, Data: "NULL"},// option: stogroup-index. Contains stogroup index.
            {ParamType: DB2_PARM_INPUT, Data: "NULL"},// option:4k-bufferpool.
            {ParamType: DB2_PARM_INPUT, Data: "NULL"},// option:8k-bufferpool.
            {ParamType: DB2_PARM_INPUT, Data: "NULL"},// option:16k-bufferpool.
            {ParamType: DB2_PARM_INPUT, Data: "NULL"},// option:32k-bufferpool.
            {ParamType: DB2_PARM_INPUT, Data: "NULL"},// option:index-bufferpool.
            {ParamType: DB2_PARM_INPUT, Data: "NULL"},// option:bp-4kb-lob.
            {ParamType: DB2_PARM_INPUT, Data: "NULL"},// option:bp-8kb-lob.
            {ParamType: DB2_PARM_INPUT, Data: "NULL"},// option:bp-16kb-lob.
            {ParamType: DB2_PARM_INPUT, Data: "NULL"},// option:bp-32kb-lob.
            {ParamType: DB2_PARM_OUTPUT, Data: "0"},// option:return-code. Contains the return code from the stored procedure.
            {ParamType: DB2_PARM_OUTPUT, Data: "Some text you see here..."},// option:message
        ];
        const preparedStatement = this.mConnection.prepareSync(query);
        const result = preparedStatement.executeSync(parameters);
        console.log(result); // tslint:disable-line

    }
}
