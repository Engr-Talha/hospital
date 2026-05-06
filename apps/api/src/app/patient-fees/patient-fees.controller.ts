import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Role } from '@hospital/shared';
import { Request } from 'express';
import { RequestUser } from '../auth/jwt.strategy';
import { Roles } from '../common/decorators/roles.decorator';
import { CreatePatientFeeLineDto } from './dto/create-patient-fee-line.dto';
import { UpdatePatientFeeLineDto } from './dto/update-patient-fee-line.dto';
import { PatientFeesService } from './patient-fees.service';

@Controller('patients/:patientId/fees')
@Roles(Role.ADMIN, Role.RECEPTIONIST)
export class PatientFeesController {
  constructor(private readonly patientFeesService: PatientFeesService) {}

  @Get()
  list(@Param('patientId', new ParseUUIDPipe()) patientId: string) {
    return this.patientFeesService.listForPatient(patientId);
  }

  @Post()
  add(
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Body() dto: CreatePatientFeeLineDto,
    @Req() req: Request & { user: RequestUser },
  ) {
    return this.patientFeesService.addLine(patientId, dto, req.user.id);
  }

  @Patch(':lineId')
  update(
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Param('lineId', new ParseUUIDPipe()) lineId: string,
    @Body() dto: UpdatePatientFeeLineDto,
  ) {
    return this.patientFeesService.updateLine(patientId, lineId, dto);
  }

  @Delete(':lineId')
  remove(
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Param('lineId', new ParseUUIDPipe()) lineId: string,
  ) {
    return this.patientFeesService.removeLine(patientId, lineId);
  }
}
