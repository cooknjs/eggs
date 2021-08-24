const livereload = require('livereload')
const liveserver = livereload.createServer()

const server = require('fastify')({
  logger: true
})
const path = require('path')

const options = {
  root: path.join(process.cwd(), 'build/private'),
  port: 6765,
  live: 35729,
  address: '0.0.0.0'
}

const start = async () => {

  server
    // set the server at the given root
    .register(require('fastify-static'), {
      root: options.root,
      list: true
    })
    // do not warn about lack of favicon
    .register(require('fastify-no-icon'))

    .addHook('onSend', async (request, reply, payload) => {
      if (
        payload.filename && (/.html$/).test(payload.filename)
      ) {
        let newPayload = ''
        await (
          new Promise(
            resolve => (
              payload
                .on('data', (chunk) => newPayload += chunk)
                .on('finish', resolve)
            )
          )
        )
        newPayload = newPayload.replace(
          '</body>',
          `<script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':${options.live}/livereload.js?snipver=1"></' + 'script>')</script></body>`
        )
        reply.header('content-length', Buffer.from(newPayload).length)

        return newPayload
      }

      return payload
    })

  try {
    await server.listen(options.port, options.address, () => {
      console.log(`An hot reload server is running on http://${options.address}:${options.port}`)
    })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }

  liveserver.watch(options.root)
}
start()