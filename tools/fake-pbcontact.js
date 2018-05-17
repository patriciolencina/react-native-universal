/**
 * Usage: ./fake-pbcontact output.txt 2000
 * * output.txt - The output file.
 * * 2000 - The number of ROWS.
 */

const fs = require('fs');
const faker = require('faker');

let ROWS = process.argv[3];
if (`${parseInt(ROWS)}` === ROWS) {
  ROWS = parseInt(ROWS);
} else {
  throw new Error('The second argument is not a number');
}

const OUTPUT = process.argv[2];

const stream = fs.createWriteStream(OUTPUT, { flags: 'w' });
stream.setDefaultEncoding('utf8');
stream.write(
  '$tel_work,$tel_home,$firstname,$lastname,$address,$email,$title,$company,$lang\n',
);
let count = 0;

function line() {
  return (
    faker.phone.phoneNumber() +
    ',' +
    faker.phone.phoneNumber() +
    ',' +
    faker.name.firstName() +
    ',' +
    faker.name.lastName() +
    ',' +
    faker.address.city() +
    ',' +
    faker.internet.email() +
    ',' +
    faker.name.jobTitle() +
    ',' +
    faker.company.companyName() +
    ',en\n'
  );
}

function write() {
  if (count > ROWS) return;

  while (stream.write(line()) && ++count < ROWS);
  stream.once('drain', write);
}

write();
