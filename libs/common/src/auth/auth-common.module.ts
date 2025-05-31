import { Module, Global } from '@nestjs/common';
import { RolesGuard } from './guards/roles.guard';
import { Reflector } from '@nestjs/core';

@Global()
@Module({
  providers: [
    RolesGuard,
    Reflector
  ],
  exports: [
    RolesGuard,
    Reflector
  ]
})
export class AuthCommonModule {} 