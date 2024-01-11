const bcrypt = require("bcrypt");
const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "userData.db");

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server initialized");
    });
  } catch (e) {
    console.log(e.message);
  }
};
initializeDbAndServer();

app.post("/register", async (request, response) => {
  console.log(request.body);
  const { username, name, password, gender, location } = request.body;
  userAlreadyExistsQuery = `
    SELECT *
    FROM USER
    WHERE userName='${username}'`;

  const DbResult = await db.get(userAlreadyExistsQuery);

  if (DbResult === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const addUserQuery = `
        INSERT INTO USER(username,name,password,gender,location)
        VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      await db.run(addUserQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
    console.log("akkumar");
  }
});
app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const isUserExistsQuery = `
     SELECT *
     FROM user
     WHERE username='${username}';`;

  const DbResult = await db.get(isUserExistsQuery);

  if (DbResult === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, DbResult.password);
    if (isPasswordMatched) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const hashPassword = await bcrypt.hash(newPassword, 10);

  const isUserExistsQuery = `
     SELECT *
     FROM user
     WHERE username='${username}';`;

  const DbResult = await db.get(isUserExistsQuery);

  const isPasswordCorrect = await bcrypt.compare(
    oldPassword,
    DbResult.password
  );
  console.log(isPasswordCorrect);
  if (isPasswordCorrect) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const updateQuery = `
        UPDATE USER
        SET
        password='${hashPassword}'
        WHERE username='${username}';`;

      await db.run(updateQuery);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
