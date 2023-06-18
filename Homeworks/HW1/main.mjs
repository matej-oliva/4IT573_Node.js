import fs from "fs";
import path from "path";
import readline from "readline";

const fileToRead = process.argv[2];
let fileToWrite = process.argv[3];
const destination = path.dirname(fileToWrite);

if (!fileToRead || !fileToWrite) {
	console.error(
		"Missing arguments!\nPlease provide these arguments in the following order:\n1. File to read\n2. File to write"
	);
	process.exit(1);
}

if (!fs.existsSync(fileToRead)) {
	console.error("File to read does not exist!");
	process.exit(1);
}

const main = () => {
	if (fs.existsSync(destination)) {
		processFile(fileToRead, fileToWrite);
		return;
	}
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	rl.question(
		"Destination folder does not exist. Do you want to create it?\n1. Create folder\n2. Cancel\n",
		(answer) => {
			if (answer === "1") {
				fs.mkdirSync(destination, { recursive: true });
				processFile(fileToRead, fileToWrite);
			} else if (answer === "2") {
				console.log("Operation cancelled!");
			} else {
				console.log("Invalid input!");
			}
			rl.close();
		}
	);
};

function processFile(fileToRead, fileToWrite) {
	fs.readFile(fileToRead, (err, data) => {
		if (err) {
			console.error(err.message);
			return;
		}

		if (fileToRead === fileToWrite) {
			fileToWrite = addCopyToFileName(fileToWrite);
		}

		if (fs.existsSync(fileToWrite)) {
			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout,
			});

			rl.question(
				"File to write already exists. Do you want to\n1. Overwrite\n2. Append\n3. Cancel\n",
				(answer) => {
					if (answer === "1") {
						writeToFile(fileToWrite, data);
					} else if (answer === "2") {
						appendToFile(fileToWrite, data);
					} else if (answer === "3") {
						console.log("Operation cancelled!");
					} else {
						console.log("Invalid input!");
					}
					rl.close();
				}
			);
		} else {
			writeToFile(fileToWrite, data);
		}
	});
}

function addCopyToFileName(fileName) {
	const fileExtension = path.extname(fileName);
	const fileNameWithoutExtension = path.basename(fileName, fileExtension);
	return `${fileNameWithoutExtension}_copy${fileExtension}`;
}

function writeToFile(fileName, data) {
	fs.writeFile(fileName, data, (err) => {
		if (err) {
			console.error(err.message);
		} else {
			console.log("File written successfully!");
		}
	});
}

function appendToFile(filename, data) {
	fs.appendFile(filename, data, (err) => {
		if (err) {
			console.error(`Error appending to file: ${err}`);
			return;
		}
		console.log(`File '${fileToRead}' appended to '${filename}'`);
	});
}

main();
