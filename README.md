# The Farming Game
This is a clone of The Farming Game (1979). I recently purchased this game at a thrift store, and found it quite entertaining, but there was no online websites which allowed me to play the game with friends. So, here we go!

## Install Instruction (Server)

#### Step 1: Install Node.js and npm

First, check if Node.js and npm are installed:

```
node -v
npm -v
```

If they're missing or outdated, install them using nvm (recommended for Raspberry Pi):

```
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
source ~/.bashrc  # or source ~/.profile
nvm install 18     # Install Node.js 18 (or latest stable)
nvm use 18         # Use Node.js 18
```

Now verify:
```
node -v  # Should output a valid Node.js version
npm -v   # Should output a valid npm version
```

#### Step 2: Install Game Dependencies

Clone the repo and then change into the `server` folder:
```
cd <your-repo-folder>/server
```
Then install dependencies from package-lock.json:
```
npm install
```

#### Step 3: Start the Game Server

To start the server, simply run:
```
node server.js
```

#### Step 4: Using pm2 to Auto-start the web hosting

```
npm install -g pm2
cd <your-repo-folder>/server
pm2 start server.js --name my-game-server
pm2 startup
```
It will output a command that looks something like this:

```
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u pi --hp /home/pi 
```

Copy and run the command it suggests.

To make sure the process is restarted after a reboot, save the process list:
```
pm2 save
```

Then you should be able to reboot and verify that the server is running:
```
sudo reboot
pm2 list
```

You should see `my-game-server` in the list!

