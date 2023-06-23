import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import flash from "connect-flash";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcrypt";
import { db } from "./database.js";
import expressEjsLayouts from "express-ejs-layouts";
import LocalStrategy from "passport-local";
import passport from "passport";
import FeedParser from "feedparser";
import axios from "axios";

export const app = express();

// Middleware
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
	session({
		secret: "The Ring Must Be Destroyed In Mount Doom",
		resave: false,
		saveUninitialized: false,
	})
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));
app.set("layout", "_layout");
app.use(expressEjsLayouts);

// User serialization/deserialization
passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser((id, done) => {
	db("users")
		.where({ id })
		.first()
		.then((user) => done(null, user))
		.catch((error) => done(error, null));
});

passport.use(
	new LocalStrategy(async (username, password, done) => {
		try {
			// Find the user by their username in the database
			const user = await db("users").where({ username }).first();

			// If the user doesn't exist, or the password is incorrect, return false
			if (!user || !(await bcrypt.compare(password, user.password))) {
				return done(null, false);
			}

			// Authentication successful, return the user
			return done(null, user);
		} catch (error) {
			return done(error);
		}
	})
);

// Google authentication strategy
// Google authentication strategy
passport.use(
	new GoogleStrategy(
		{
			clientID:
				"949203705869-uqdmjca8b6o52fgssjesehi461tve3r2.apps.googleusercontent.com",
			clientSecret: "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",
			callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				// Check if the user already exists in the database
				let user = await db("users")
					.where({ google_id: profile.id })
					.first();

				if (user) {
					// User already exists, return the user
					return done(null, user);
				} else {
					// User doesn't exist, create a new user
					const newUser = {
						google_id: profile.id,
						username: profile.displayName,
					};

					// Insert the new user into the database
					const [userId] = await db("users").insert(newUser);

					// Fetch the newly created user from the database
					user = await db("users").where({ id: userId }).first();

					// Return the user
					return done(null, user);
				}
			} catch (error) {
				// Error occurred, pass the error to the done callback
				return done(error, null);
			}
		}
	)
);

async function fetchFeedContent(url) {
	try {
		const response = await axios.get(url, {
			responseType: "arraybuffer",
		});
		const feedItems = [];

		const feedparser = new FeedParser();
		feedparser.write(response.data);
		feedparser.end();

		feedparser.on("error", (error) => {
			throw error;
		});

		feedparser.on("readable", function () {
			let item;
			while ((item = this.read())) {
				feedItems.push(item);
			}
		});

		return new Promise((resolve, reject) => {
			feedparser.on("end", () => {
				resolve(feedItems);
			});

			feedparser.on("error", (error) => {
				reject(error);
			});
		});
	} catch (error) {
		throw error;
	}
}

// Routes
app.get("/", async (req, res) => {
	try {
		const user = req.user;
		let feeds = [];

		if (user) {
			feeds = await db("feeds").where({ user_id: req.user.id });

			for (const feed of feeds) {
				const feedContent = await fetchFeedContent(feed.url);
				feed.items = feedContent;
			}
		}

		res.render("index", { user, feeds, message: null });
	} catch (error) {
		console.error(error);
		res.status(500).send("Internal Server Error");
	}
});

app.get(
	"/auth/google",
	passport.authenticate("google", { scope: ["profile"] })
);

app.get(
	"/auth/google/callback",
	passport.authenticate("google", {
		successRedirect: "/",
		failureRedirect: "/login",
		failureFlash: "Failed to authenticate with Google",
	})
);

app.get("/register", (req, res) => {
	res.render("register", { message: null, user: req.user });
});

app.post("/register", async (req, res) => {
	const { username, password } = req.body;

	try {
		// Check if the username already exists in the database
		const existingUser = await db("users").where({ username }).first();

		if (existingUser) {
			req.flash("message", "Username already exists");
			return res.render("register", {
				message: req.flash("message"),
				user: null,
			});
		}

		// Hash the password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Create a new user
		const newUser = {
			username,
			password: hashedPassword,
		};

		// Insert the new user into the database
		await db("users").insert(newUser);

		res.redirect("/login");
	} catch (error) {
		req.flash("message", "Failed to register");
		res.redirect("/register");
	}
});

app.get("/login", (req, res) => {
	res.render("login", { message: null, user: req.user });
});

app.post("/login", (req, res, next) => {
	passport.authenticate("local", (err, user) => {
		if (err) {
			// Handle the error
			return next(err);
		}
		if (!user) {
			// Authentication failed, display an error message
			req.flash("message", "Invalid username or password");
			return res.render("login", {
				message: req.flash("message"),
				user: null,
			});
		}
		// Authentication successful, log in the user
		req.logIn(user, (err) => {
			if (err) {
				return next(err);
			}
			// Redirect to the desired location or show a success message
			return res.redirect("/");
		});
	})(req, res, next);
});

app.get("/feeds", async (req, res) => {
	try {
		if (req.user && req.user.id) {
			const feeds = await db("feeds").where({ user_id: req.user.id });

			for (const feed of feeds) {
				const feedContent = await fetchFeedContent(feed.url);
				feed.items = feedContent;
			}

			res.render("feeds", { feeds, user: req.user, message: null });
		} else {
			res.redirect("/login");
		}
	} catch (error) {
		req.flash("message", "Failed to fetch feeds");
		res.redirect("/");
	}
});

app.get("/feeds/new", (req, res) => {
	res.render("new-feed", { name: null, user: req.user, message: null });
});

app.post("/feeds", async (req, res) => {
	const { name, url } = req.body;
  const userId = req.user.id;

  try {
    const response = await axios.get(url, { responseType: 'stream' });
    const feedStream = response.data;

    const feedPromise = new Promise((resolve, reject) => {
      const feedparser = new FeedParser();

      feedparser.on('error', (error) => {
        req.flash("message", "Invalid feed URL: " + error.message);
  
        return res.render("new-feed", {
          name,
          user: req.user,
          message: req.flash("message"),
        });
      });

      feedparser.on('meta', async (meta) => {
        // Check if the feed is a valid RSS feed by inspecting the parsed metadata
        if (meta.title && meta.description) {
          try {
            await db("feeds").insert({ user_id: userId, name, url })
            res.redirect("/feeds");
          } catch (error) {
            console.error("Error adding feed to the database:", error);
            return res.status(500).json({ error: "Failed to add feed" });
          }
        } else {
          console.error("Invalid feed metadata");
          return res.status(400).json({ error: "Invalid feed URL" });
        }
      });

      feedStream.pipe(feedparser);
    });

    await feedPromise;
    res.redirect("/feeds");
	} catch (error) {
    console.error("Feed parsing error:", error);
    req.flash("message", "Invalid feed URL");
		return res.render("new-feed", {
      name,
      user: req.user,
      message: req.flash("message"),
    });
	}
});

app.post("/feeds/:id/delete", async (req, res) => {
	const feedId = req.params.id;

	try {
		await db("feeds").where({ id: feedId }).del();
		res.redirect("/feeds");
	} catch (error) {
		req.flash("message", "Failed to delete feed");
		res.redirect("/feeds");
	}
});

app.get("/logout", (req, res) => {
	req.session.destroy();
	res.redirect("/");
});

export default app;
