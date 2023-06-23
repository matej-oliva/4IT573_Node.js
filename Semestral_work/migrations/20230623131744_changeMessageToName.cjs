exports.up = function (knex) {
  return knex.schema
    .alterTable('feeds', function (table) {
      table.renameColumn('message', 'name');
    });
};

exports.down = function (knex) {
  return knex.schema
    .alterTable('feeds', function (table) {
      table.renameColumn('name', 'message');
    });
};
