export default {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './db.sqlite',
    },
    useNullAsDefault: false,
  },
  test: {
    client: 'sqlite3',
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
  },
}
