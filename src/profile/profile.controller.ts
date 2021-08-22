import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { User } from 'src/user/decorators/user.decorator';
import { AuthGuard } from 'src/user/guards/auth.guard';
import { ProfileService } from './profile.service';
import { ProfileResponseInterface } from './types/profile-response.interface';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // GET PROFILE
  @Get(':username')
  @UseGuards(AuthGuard)
  async getProfile(
    @User('id') userId: number,
    @Param('username') profileUsername: string,
  ): Promise<ProfileResponseInterface> {
    const profile = await this.profileService.getProfile(
      userId,
      profileUsername,
    );
    return this.profileService.buildProfileResponse(profile);
  }

  // FOLLOW USER
  @Post(':username/follow')
  @UseGuards(AuthGuard)
  async followUser(
    @User('id') userId: number,
    @Param('username') profileUsername: string,
  ): Promise<ProfileResponseInterface> {
    const profile = await this.profileService.followUser(
      userId,
      profileUsername,
    );
    return this.profileService.buildProfileResponse(profile);
  }

  // UNFOLLOW USER
  @Delete(':username/follow')
  @UseGuards(AuthGuard)
  async unfollowUser(
    @User('id') userId: number,
    @Param('username') profileUsername: string,
  ): Promise<ProfileResponseInterface> {
    const profile = await this.profileService.unfollowUser(
      userId,
      profileUsername,
    );
    return this.profileService.buildProfileResponse(profile);
  }
}
