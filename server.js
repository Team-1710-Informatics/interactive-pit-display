import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { join } from 'path';
import { categories, getDefaultImage, autoplayConfig } from './config/images.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fastify = Fastify({
  logger: true
});

// Serve static files from public directory
await fastify.register(fastifyStatic, {
  root: join(__dirname, 'public'),
  prefix: '/'
});

// Serve images from images directory
await fastify.register(fastifyStatic, {
  root: join(__dirname, 'images'),
  prefix: '/images/',
  decorateReply: false
});

// Store SSE clients
const sseClients = new Set();
// Track connected clients by type (view or control)
const clientTypes = new Map();

// Broadcast message to all connected clients
function broadcast(message) {
  const eventType = message.type || 'message';
  const data = `event: ${eventType}\ndata: ${JSON.stringify(message)}\n\n`;
  console.log('Broadcasting:', eventType, message);
  for (const client of sseClients) {
    try {
      client.raw.write(data);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

// Broadcast to view screens only
function broadcastToView(message) {
  const eventType = message.type || 'message';
  const data = `event: ${eventType}\ndata: ${JSON.stringify(message)}\n\n`;
  console.log('Broadcasting to view screens:', eventType, message);
  for (const client of sseClients) {
    const clientType = clientTypes.get(client);
    if (clientType === 'view') {
      try {
        client.raw.write(data);
      } catch (err) {
        sseClients.delete(client);
        clientTypes.delete(client);
      }
    }
  }
}

// Broadcast to control screens only
function broadcastToControl(message) {
  const eventType = message.type || 'message';
  const data = `event: ${eventType}\ndata: ${JSON.stringify(message)}\n\n`;
  console.log('Broadcasting to control screens:', eventType, message);
  for (const client of sseClients) {
    const clientType = clientTypes.get(client);
    if (clientType === 'control') {
      try {
        client.raw.write(data);
      } catch (err) {
        sseClients.delete(client);
        clientTypes.delete(client);
      }
    }
  }
}

// SSE endpoint - clients subscribe here for updates
fastify.get('/events', async (request, reply) => {
  reply.raw.setHeader('Content-Type', 'text/event-stream');
  reply.raw.setHeader('Cache-Control', 'no-cache');
  reply.raw.setHeader('Connection', 'keep-alive');

  // Get client type from query param
  const clientType = request.query.type || 'unknown';

  // Add client to set
  sseClients.add(reply);
  clientTypes.set(reply, clientType);

  // Send initial connection message with config
  reply.raw.write(`event: connected\ndata: ${JSON.stringify({
    type: 'connected',
    clientType,
    config: {
      categories,
      defaultImage: getDefaultImage(),
      autoplay: autoplayConfig
    }
  })}\n\n`);

  // Remove client on close
  request.raw.on('close', () => {
    sseClients.delete(reply);
    clientTypes.delete(reply);
  });

  return reply;
});

// API: Get image configuration
fastify.get('/api/config', async (request, reply) => {
  return {
    categories,
    defaultImage: getDefaultImage(),
    autoplay: autoplayConfig
  };
});

// API: Select an image to display
fastify.post('/api/select-image', async (request, reply) => {
  const { categoryKey, imageIndex } = request.body;

  // Find the image
  const category = categories.find(c => c.key === categoryKey);
  if (!category) {
    return reply.code(404).send({ error: 'Category not found' });
  }

  const image = category.images[imageIndex];
  if (!image) {
    return reply.code(404).send({ error: 'Image not found' });
  }

  // Broadcast to view screens
  broadcastToView({
    type: 'display-image',
    categoryKey,
    imageIndex,
    image: {
      filename: image.filename,
      displayName: image.displayName
    }
  });

  // Broadcast to control screens to update active state
  broadcastToControl({
    type: 'active-image',
    categoryKey,
    imageIndex
  });

  return { success: true };
});

// API: Start auto-play mode
fastify.post('/api/start-autoplay', async (request, reply) => {
  const defaultCategory = categories.find(c => c.key === 'TeamIdentity');
  if (!defaultCategory) {
    return reply.code(404).send({ error: 'Default category not found' });
  }

  // Broadcast to control screens
  broadcastToControl({
    type: 'autoplay-started',
    categoryKey: 'TeamIdentity'
  });

  // Broadcast first image to view screens
  broadcastToView({
    type: 'display-image',
    categoryKey: 'TeamIdentity',
    imageIndex: 0,
    image: {
      filename: defaultCategory.images[0].filename,
      displayName: defaultCategory.images[0].displayName
    },
    autoplay: true
  });

  return { success: true };
});

// API: Stop auto-play mode
fastify.post('/api/stop-autoplay', async (request, reply) => {
  broadcastToControl({
    type: 'autoplay-stopped'
  });

  return { success: true };
});

// API: Cycle to next image in auto-play
fastify.post('/api/next-autoplay-image', async (request, reply) => {
  const { imageIndex } = request.body;
  const category = categories.find(c => c.key === 'TeamIdentity');
  if (!category) {
    return reply.code(404).send({ error: 'Default category not found' });
  }

  const nextIndex = (imageIndex + 1) % category.images.length;
  const image = category.images[nextIndex];

  // Broadcast to view screens
  broadcastToView({
    type: 'display-image',
    categoryKey: 'TeamIdentity',
    imageIndex: nextIndex,
    image: {
      filename: image.filename,
      displayName: image.displayName
    },
    autoplay: true
  });

  // Broadcast to control screens to update active state
  broadcastToControl({
    type: 'active-image',
    categoryKey: 'TeamIdentity',
    imageIndex: nextIndex,
    autoplay: true
  });

  return { success: true, nextIndex };
});

// Control page redirect
fastify.get('/control', async (request, reply) => {
  return reply.redirect('/control.html');
});

// View page redirect
fastify.get('/view', async (request, reply) => {
  return reply.redirect('/view.html');
});

// Start server
try {
  await fastify.listen({ port: 3000, host: '0.0.0.0' });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
