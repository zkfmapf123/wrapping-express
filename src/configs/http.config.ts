import cluster from 'cluster'
import express from 'express'
import os from 'os'
import { Controller, Middlewares } from '../utils/index'

export class HttpConnector {
  private app: express.Express
  private readonly port: number
  private readonly env: string

  constructor(app: express.Express, port: number, env: string) {
    this.app = app
    this.port = port
    this.env = env
  }

  // Middleware 설정 (cors, helmet, etc..)
  setHTTPMiddleware(module: any): this {
    this.app.use(module)
    return this
  }

  // Controller 설정
  setControllers(controllers: Controller[]): this {
    controllers.forEach((c) => this.app.use(c.initRoutes()))
    return this
  }

  // Custom Middleware 설정
  setCustomMiddleware(middleware: Middlewares): this {
    this.app.use(middleware)
    return this
  }

  // Error Handling 설정
  setErrorHandling(): this {
    this.app.use('/*', (req, res) => {
      res.status(404).send('Not Found')
    })
    return this
  }

  // 서버 실행 (Options: Cluster Mode)
  start(isClusterMode = true) {
    if (isClusterMode && cluster.isPrimary) {
      const numCpus = os.cpus().length

      for (let i = 0; i < numCpus; i++) {
        cluster.fork()
      }

      cluster.on('exit', (w, c, s) => {
        console.log(`Worker ${w.process.pid} died`)
        cluster.fork()
      })
    } else {
      this.app.listen(this.port, () => {
        console.log(`connect to ${this.env} : ${process.pid} => ${this.port}`)
      })
    }
  }
}
