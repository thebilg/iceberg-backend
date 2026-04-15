import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { PropertyModule } from './modules/property/property.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { AgentModule } from './modules/agent/agent.module';


@Module({
  imports: [
    ConfigModule.forRoot(),

    MongooseModule.forRoot(process.env.MONGO_URI as string),

    PropertyModule,
    TransactionModule,
    AgentModule,
  ],
})
export class AppModule {}



// import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
// import { MongooseModule } from '@nestjs/mongoose';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';

// @Module({
//   imports: [
//     ConfigModule.forRoot(),
//     MongooseModule.forRoot(process.env.MONGO_URI as string),
//   ],
//   controllers: [AppController],
//   providers: [AppService],
// })
// export class AppModule {}