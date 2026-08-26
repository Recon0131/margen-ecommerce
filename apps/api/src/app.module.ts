import { Controller, Get, Module } from '@nestjs/common';
@Controller() class HealthController { @Get('health') health(): {status:'ok';version:string} { return {status:'ok',version:process.env.APP_VERSION ?? '0.1.0'}; } }
@Module({controllers:[HealthController]}) export class AppModule {}
