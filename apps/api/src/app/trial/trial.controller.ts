import { Body, Controller, Get, Patch, UsePipes, ValidationPipe } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { TrialManagePatchDto } from './dto/trial-manage.dto';
import { TrialService } from './trial.service';

@Controller('trial')
export class TrialController {
  constructor(private readonly trial: TrialService) {}

  @Public()
  @Get('status')
  status() {
    return this.trial.getPublicStatus();
  }

  @Public()
  @Patch('manage')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  manage(@Body() body: TrialManagePatchDto) {
    return this.trial.applyManagePatch(body);
  }
}
