var express = require('express');
var app = express();
const fs = require('fs');
const https = require('https');
/**
 * IMPORTANT NOTES:
 - Congratulations! Your certificate and chain have been saved at:
   /etc/letsencrypt/live/apps.brekeke.com/fullchain.pem
   Your key file has been saved at:
   /etc/letsencrypt/live/apps.brekeke.com/privkey.pem
   Your cert will expire on 2018-07-24. To obtain a new or tweaked
   version of this certificate in the future, simply run
   letsencrypt-auto again. To non-interactively renew *all* of your
   certificates, run "letsencrypt-auto renew"
 - If you like Certbot, please consider supporting our work by:

   Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
   Donating to EFF:                    https://eff.org/donate-le
 */
app.get(
  '/.well-known/acme-challenge/NzyF7ThKja9Hxnh2txhZxgM21UsPFYlaILYKK1OWFg8',
  function(req, res) {
    res.send(
      'NzyF7ThKja9Hxnh2txhZxgM21UsPFYlaILYKK1OWFg8.Wz_fGNgu-PLP-fwLH8N1Lx2rPj46bTWxSBnas1DYJRA',
    );
  },
);
// Certificate
const privateKey = fs.readFileSync(
  '/etc/letsencrypt/live/apps.brekeke.com/privkey.pem',
  'utf8',
);
const certificate = fs.readFileSync(
  '/etc/letsencrypt/live/apps.brekeke.com/cert.pem',
  'utf8',
);
const ca = fs.readFileSync(
  '/etc/letsencrypt/live/apps.brekeke.com/chain.pem',
  'utf8',
);

app.get('/app/android', function(req, res) {
  res.sendFile('/home/ec2-user/app/app-release.apk');
});

app.get('/app/ios/manifest', function(req, res) {
  res.download('/home/ec2-user/app/manifest.plist', 'manifest.plist');
});
app.get('/app/ios', function(req, res) {
  res.download('/home/ec2-user/app/Phone.ipa', 'phone.ipa');
});
app.get('/app/iphone', function(req, res) {
  res.send(
    '<a href="itms-services://?action=download-manifest&url=https://apps.brekeke.com/app/ios/manifest">Install App</a>',
  );
});
app.get('/app/ios/logo512', function(req, res) {
  res.download('/home/ec2-user/app/logo512.png', 'logo512.png');
});
app.get('/app/ios/logo57', function(req, res) {
  res.download('/home/ec2-user/app/logo57.png', 'logo57.png');
});

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca,
};

//pm2 restart server/index.js
app.use(express.static(__dirname + './../dist/web/')); //serves the index.html
app.listen(3000); //listens on port 3000 -> http://localhost:3000/
const httpsServer = https.createServer(credentials, app);
httpsServer.listen(3443, () => {
  console.log('HTTPS Server running on port 443');
});
