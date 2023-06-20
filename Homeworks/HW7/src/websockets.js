import ejs from 'ejs'
import { WebSocketServer, WebSocket } from 'ws'
import { db } from './database.js'

/** @type {Set<WebSocket>} */
const connections = new Set()

export const createWebSocketServer = (server) => {
  const wss = new WebSocketServer({ server })

  wss.on('connection', (ws) => {
    ws.redirectToHomepage = false;
    connections.add(ws)

    console.log('New connection', connections.size)

    ws.on('message', async (message) => {
      const parsedMessage = JSON.parse(message)

      if (parsedMessage.type === 'todo-delete') {
        await db('todos').where('id', parsedMessage.id).delete()
        sendTodoDeleteToAllConnections(parsedMessage.id)
      }

      if (parsedMessage.type === 'todo-done-state') {
        const { todoId, updatedDoneState } = parsedMessage;
        await db("todos")
          .where("id", todoId)
          .update({ done: updatedDoneState });

        sendTodoDoneStateToAllConnections(todoId, updatedDoneState);
      }

    })

    ws.on('close', () => {
      connections.delete(ws)

      console.log('Closed connection', connections.size)
      if (ws.redirectToHomepage) {
        ws.send(JSON.stringify({ type: "redirect-homepage" }));
      }
    })
  })
}


export const sendTodosToAllConnections = async () => {
  try {
    const todos = await db("todos").select("*");
    const html = await ejs.renderFile("views/fragments/_todos.ejs", { todos });

    const message = {
      type: "todos",
      html,
    };

    for (const connection of connections) {
      connection.send(JSON.stringify(message));
    }
  } catch (e) {
    console.error(e);
  }
};

export const sendTodoDeleteToAllConnections = async (id) => {
  try {
    const message = {
      type: "todo-delete",
      id,
    };

    for (const connection of connections) {
      sendTodoDeleteToConnection(connection, message);
    }
  } catch (e) {
    console.error(e);
  }
};

const sendTodoDeleteToConnection = (connection, message) => {
  const { type, id } = message;

  if (connection.readyState === WebSocket.OPEN) {
    connection.send(JSON.stringify(message));

    if (type === "todo-delete" && connection.detailId === id) {
      connection.redirectToHomepage = true;
    }
  }
};

export async function sendTodoDoneStateToAllConnections(todoId, updatedDoneState) {
  const todo = await db("todos").where("id", todoId).first();
  const html = await ejs.renderFile("views/fragments/_todoDetailCard.ejs", { todo });

  const message = JSON.stringify({
    type: "todo-done-state",
    todoId,
    updatedDoneState,
    html
  });

  for (const connection of connections) {
    connection.send(message);
  }
}