import express from "express";
import mysql from "mysql2";
import cors from "cors";
import bcrypt from "bcrypt";

const app = express();
const port = 8800;

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Jagath@2003",
  database: "social",
});

app.use(express.json());
app.use(cors());

const saltRounds = 10;
app.get("/profile/:userId", (req, res) => {
  const userId = req.params.userId;

  const selectProfileQuery = "SELECT * FROM user WHERE id = ?";
  const selectPostsQuery = "SELECT * FROM post WHERE userid = ? ORDER BY createdat DESC";

  db.query(selectProfileQuery, [userId], (err, userData) => {
    if (err) {
      console.error("Error fetching user profile:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (!userData || userData.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    db.query(selectPostsQuery, [userId], (err, postsData) => {
      if (err) {
        console.error("Error fetching user posts:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      const profile = {
        id: userData[0].id,
        username: userData[0].username,
        email: userData[0].email,
        bio: userData[0].bio,
        avatar: userData[0].avatar, // Assuming you store the avatar URL in the database
      };

      const posts = postsData.map((post) => ({
        id: post.id,
        userid: post.userid,
        description: post.description,
        createdat: post.createdat,
      }));

      res.status(200).json({ profile, posts });
    });
  });
});
app.put("/update-post/:postId", (req, res) => {
  const postId = req.params.postId;
  const { description } = req.body;

  const updatePostQuery = "UPDATE post SET description = ? WHERE id = ?";
  
  db.query(updatePostQuery, [description, postId], (err, result) => {
    if (err) {
      console.error("Error updating post:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.status(200).json({ message: "Post updated successfully" });
  });
});
app.delete("/delete-post/:postId", (req, res) => {
  const postId = req.params.postId;

  const deletePostQuery = "DELETE FROM post WHERE id = ?";
  
  db.query(deletePostQuery, [postId], (err, result) => {
    if (err) {
      console.error("Error deleting post:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.status(200).json({ message: "Post deleted successfully" });
  });
});

app.get("/posts", (req, res) => {
  const selectPostsQuery = "SELECT * FROM post ORDER BY createdat DESC";
  db.query(selectPostsQuery, (err, posts) => {
    if (err) {
      console.error("Error fetching posts:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.status(200).json(posts);
  });
});
app.post("/create-post", (req, res) => {
    const { userid, description } = req.body;
  
    const insertPostQuery = "INSERT INTO post (userid, description) VALUES (?, ?)";
    db.query(insertPostQuery, [userid, description], (err, result) => {
      if (err) {
        console.error("Error inserting post:", err);
        return res.status(500).json({ error: "Failed to create post" });
      }
  
      return res.status(200).json({ message: "Post created successfully", postId: result.insertId });
    });
  });
    
app.post("/register", (req, res) => {
  const { username, email, password } = req.body;

  const checkUsernameQuery = "SELECT COUNT(*) AS count FROM user WHERE username = ?";
  db.query(checkUsernameQuery, [username], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (result[0].count > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      const insertUserQuery = "INSERT INTO user(username, email, password) VALUES (?, ?, ?)";
      db.query(insertUserQuery, [username, email, hash], (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        return res.status(200).json({ message: "User created successfully" });
      });
    });
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const selectUserQuery = "SELECT * FROM user WHERE username = ?";
  db.query(selectUserQuery, [username], (err, data) => {
    if (err) {
      console.error("Error executing database query:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (data.length === 0) {
      return res.status(400).json({ message: "User does not exist. Sign up to create an account." });
    }

    bcrypt.compare(password, data[0].password, (err, response) => {
      if (err) {
        console.error("Error comparing passwords:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      if (response) {
        return res.status(200).json({
          id: data[0].id,
          username: data[0].username,
          message: "Welcome to Tenzies",
        });
      } else {
        return res.status(401).json({ message: "Username/password incorrect" });
      }
    });
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
