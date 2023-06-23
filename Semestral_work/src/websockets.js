import { WebSocketServer } from "ws";

/** @type {Set<WebSocket>} */
const connections = new Set()

export const createWebSocketServer = (server) => {
  const wss = new WebSocketServer({ server })

  wss.on('connection', socket => {
    console.log('A client connected.');
  
    // Handle new feed event
    socket.on('message', message => {
      const data = JSON.parse(message);
  
      if (data.type === 'newFeed') {
        // Process the new feed and save it to the database
        // ...
  
        // Broadcast the new feed to all connected clients
        wss.clients.forEach(client => {
          if (client !== socket && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'feedAdded', feed: data.feed }));
          }
        });
      } else if (data.type === 'deleteFeed') {
        // Process the feed deletion from the database
        // ...
  
        // Broadcast the deleted feed ID to all connected clients
        wss.clients.forEach(client => {
          if (client !== socket && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'feedDeleted', feedId: data.feedId }));
          }
        });
      }
    });
  
    // Handle disconnection event
    socket.on('close', () => {
      console.log('A client disconnected.');
    });
  })
}