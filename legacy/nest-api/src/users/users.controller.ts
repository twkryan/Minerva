import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {} //heres the dependency injection

  @Post('onboarding') // defines the route, so it would be api/users/onboarding
  @ApiOperation({ summary: 'Salvar dados do onboarding do aluno' }) //swagger decoration for api info
  async saveOnboarding(@Body() body: any) { //Body decorator makes nest understand that he needs to take the json from
    // the htttp request, body is the json, and any means that we must accept any format of json
    return this.usersService.createOnboarding(body);
  }

  @Get('profile/:clerk_user_id')
  @ApiOperation({ summary: 'Checar se o usuário já fez onboarding' })
  async getProfile(@Param('clerk_user_id') id: string) {
    return this.usersService.checkProfile(id);
  }
}