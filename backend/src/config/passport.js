const passport = require('passport');
const DiscordStrategy = require('passport-discord-auth').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

if (!process.env.DISCORD_CLIENT_ID || process.env.DISCORD_CLIENT_ID === 'your-discord-client-id') {
  console.log('⚠️  Discord OAuth not configured — guest login only');
} else {
  passport.use(new DiscordStrategy({
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackUrl: process.env.DISCORD_CALLBACK_URL,
    scope: ['identify', 'email'],
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ discordId: profile.id });

    const avatarUrl = profile.avatar
      ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(profile.discriminator || 0) % 5}.png`;

    if (user) {
      user.username = profile.username;
      user.avatar = avatarUrl;
      user.email = profile.email;
      user.lastSeen = new Date();
      await user.save();
    } else {
      user = await User.create({
        discordId: profile.id,
        username: profile.username,
        avatar: avatarUrl,
        email: profile.email,
        authType: 'discord',
      });
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
  }));
}
