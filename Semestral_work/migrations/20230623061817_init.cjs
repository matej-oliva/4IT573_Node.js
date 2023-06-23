exports.up = function (knex) {
  return knex.schema
    .createTable('users', function (table) {
      table.increments('id').primary();
      table.string('username').notNullable();
      table.string('password').notNullable();
      table.timestamps(true, true);
    })
    .createTable('feeds', function (table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.foreign('user_id').references('users.id').onDelete('CASCADE');
      table.string('url').notNullable();
      table.string('message');
      table.timestamps(true, true);
    });
};


exports.down = function (knex) {
  return knex.schema.dropTable('feeds').dropTable('users');
};
