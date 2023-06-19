exports.up = function (knex) {
	return knex.schema.alterTable("todos", function (table) {
		table.string("priority");
		table.date("due_date");
	});
};

exports.down = function (knex) {
	return knex.schema.alterTable("todos", function (table) {
		table.dropColumn("priority");
		table.dropColumn("due_date");
	});
};
