import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
import { FeatureFlagsService } from '../services/feature-flags.service';

@ApiTags('feature-flags')
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlags: FeatureFlagsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get enabled feature flags for the client' })
  getFlags() {
    return this.featureFlags.getAll();
  }
}
