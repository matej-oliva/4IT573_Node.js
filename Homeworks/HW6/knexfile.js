export default {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './src/database',
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