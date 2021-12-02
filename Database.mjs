import Parser from "./parser.mjs";
import DatabaseError from "./DatabaseError.mjs";

export default class Database {
  constructor() {
    this.tables = {};
    this.parser = new Parser();
  }

  createTable(statement) {
    const tableName = statement[1];
    let columns = statement[2];

    columns = columns.split(',');

    this.tables[tableName] = {
      columns: {},
      data: [],
    };

    for (let column of columns) {
      column = column.trim().split(' ');

      const name = column[0];
      const type = column[1];

      this.tables[tableName].columns[name] = type;
    }

    console.log(JSON.stringify(this, null, 2));
  }
  insert(statement) {
    let [, tableName, columns, values] = statement;
    columns = columns.trim().split(', ');
    values = values.trim().split(', ');
    const row = {};
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const value = values[i];
      row[column] = value;
    }
    this.tables[tableName].data.push(row);
  }
  select(statement) {
    let [, columns, tableName, whereClause] = statement;
    columns = columns.split(', ');
    let rows = this.tables[tableName].data;

    if (whereClause) {
      const [columnWhere, valueWhere] = whereClause.split(' = ');

      rows = rows.filter(function (row) {
        return row[columnWhere] === valueWhere;
      });
    }

    rows = rows.map(function (row) {
      let selectedRow = {};
      columns.forEach(function (column) {
        selectedRow[column] = row[column];
      });
      return selectedRow;
    });

    return rows;
  }
  delete(statement) {
    const [, tableName, whereClause] = statement;
    if (whereClause) {
      const [columnWhere, valueWhere] = whereClause.split(' = ');
      this.tables[tableName].data = this.tables[tableName].data.filter(
        function (row) {
          return row[columnWhere] !== valueWhere;
        }
      );
    } else {
      this.tables[tableName].data = [];
    }

    return this.tables[tableName].data;
  }
  execute(statement) {
    let result = this.parser.parse(statement);

    if (result) {
      return this[result.command](result.parsedStatement);
    } else {
      let message = `Syntax error: '${statement}'`;

      throw new DatabaseError(message, statement);
    }
  }
}