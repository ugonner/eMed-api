import { INestApplication, OnModuleInit } from '@nestjs/common';
import { NestApplication } from '@nestjs/core';
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { ExpressPeerServer } from 'peer';
import * as express from 'express';

export class PeerGateway implements OnModuleInit {
  onModuleInit() {
    console.log("peer gateway started")
  }

  async startPeerServer(app: INestApplication<any>) {
    try{
       const httpServer = app.getHttpServer();
      //const httpServer = await app.getHttpAdapter().getInstance();

      const peerServer = ExpressPeerServer(httpServer, {
        path: "/peerjs",
        allow_discovery: true,
        corsOptions: {origin: "*"}
      });
      peerServer.on("connection", (peer) => {
        console.log("Peer connected:", peer.getId());
      })
      peerServer.on("disconnect", (peer) => {
        console.log("Peer Disconnected:", peer.getId());
      })

      peerServer.on("error", (error) => {
        console.log("Peer Error:", error.message);
      })
      
      
      app.use("/peerjs", peerServer);
      
      
      console.log("peer server started");
    }catch(error){
      console.log("Error starting peer server", error.message)
    }
  }
}
