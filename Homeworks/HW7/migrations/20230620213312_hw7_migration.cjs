exports.up = function (knex) {
	return knex.schema
		.createTable("users", function (table) {
			table.increments("id").primary();
			table.string("username").notNullable().unique();
			table.string("password").notNullable();
			table.timestamps(true, true);
		})
		.createTable("todos", function (table) {
			table.increments("id").primary();
			table.string("title").notNullable();
			table.string("description");
			table.boolean("done").defaultTo(false);
			table.timestamps(true, true);
			table.string("priority");
			table.date("due_date");
			table.integer("user_id").unsigned();
			table.foreign("user_id").references("users.id").onDelete("CASCADE");
		});
};

exports.down = function (knex) {
	return knex.schema.dropTable("todos").dropTable("users");
};
