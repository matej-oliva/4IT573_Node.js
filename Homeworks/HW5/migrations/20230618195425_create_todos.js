exports.up = function (knex) {
  return knex.schema.createTable('todos', function (table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.string('description').notNullable();
    table.boolean('done').defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('todos');
};
