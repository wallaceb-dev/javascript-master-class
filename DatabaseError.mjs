export default class DatabaseError {
  constructor(message, statement) {
    this.message = message;
    this.statement = statement;
  }
}