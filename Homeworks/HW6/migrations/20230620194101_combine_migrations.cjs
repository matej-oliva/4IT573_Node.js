exports.up = function (knex) {
  return knex.schema.createTable('todos', function (table) {
    table.date("due_date");
    table.increments('id').primary();
    table.string('title').notNullable();
    table.string('description');
    table.boolean('done').defaultTo(false);
    table.timestamps(true, true);
    table.string("priority");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('todos');
};
