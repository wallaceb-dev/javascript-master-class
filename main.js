class Parser {
  constructor() {
    this.commands = new Map();
    this.commands.set(
      'insert',
      /insert into ([a-z]+) \((.+)\) values \((.+)\)/
    );
    this.commands.set('select', /select (.+) from ([a-z]+)(?: where (.+))?/);
    this.commands.set('delete', /delete from ([a-z]+) (?:where (.+))?/);
    this.commands.set('createTable', /create table ([a-z]+) \((.+)\)/);
  }

  parse(statement) {
    for (let [command, regexp] of this.commands) {
      const parsedStatement = statement.match(regexp);
      if (parsedStatement) {
        return {
          command,
          parsedStatement,
        };
      }
    }
  }
}

class DatabaseError {
  constructor(message, statement) {
    this.message = message;
    this.statement = statement;
  }
}

class Database {
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
try {
  const database = new Database();

  database.execute(
    'create table author (id number, name string, age number, city string, state string, country string)'
  );

  database.execute(
    'insert into author (id, name, age) values (1, Douglas Crockford, 62)'
  );
  database.execute(
    'insert into author (id, name, age) values (2, Linus Torvalds, 47)'
  );
  database.execute(
    'insert into author (id, name, age) values (3, Martin Fowler, 54)'
  );

  console.log(
    JSON.stringify(
      database.execute('select name from author where id = 3'),
      null,
      2
    )
  );

  console.log(
    JSON.stringify(database.execute('select name, age from author'), null, 2)
  );

  console.log(
    JSON.stringify(
      database.execute('delete from author where id = 2'),
      null,
      2
    )
  );
} catch (error) {
  console.log(error.message);
}
