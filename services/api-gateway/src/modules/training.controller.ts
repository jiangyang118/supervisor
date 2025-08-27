import { Controller, Get, Post, Body, Query, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TrainingService, QuestionType } from './training.service';

@Controller('school/training')
export class TrainingController {
  constructor(private readonly svc: TrainingService) {}

  // Courses
  @Get('courses') listCourses(){ return this.svc.listCourses(); }
  @Post('courses') createCourse(@Body() b: { title: string; desc?: string }){ return this.svc.createCourse(b); }

  // Exams
  @Get('exams') listExams(@Query('courseId') courseId?: string){ return this.svc.listExams({ courseId }); }
  @Post('exams') createExam(@Body() b: { title: string; courseId?: string; shuffle?: boolean; showScore?: boolean; showAnswers?: boolean; showAnalysis?: boolean; passScore?: number }){ return this.svc.createExam(b); }

  // Questions
  @Get('questions') listQuestions(@Query('examId') examId: string){ return this.svc.listQuestions(examId); }
  @Post('questions') addQuestion(@Body() b: { examId: string; type: QuestionType; stem: string; options?: { key: string; text: string }[]; answer: string[]; analysis?: string; score?: number }){ return this.svc.addQuestion(b); }

  // Submission and results
  @Post('submit') submit(@Body() b: { examId: string; user: string; answers: Record<string, string[]> }){ return this.svc.submit(b); }
  @Get('results') listResults(@Query('examId') examId?: string){ return this.svc.listResults({ examId }); }

  // Notifications (simulated)
  @Post('notify') notify(@Body() b: { examId: string; channel: 'sms'|'app'|'email'; to: string }){ return this.svc.notify(b); }
  @Get('notifications') notifications(@Query('examId') examId?: string){ return this.svc.listNotifications({ examId }); }

  @Sse('stream') stream(): Observable<MessageEvent> { return this.svc.stream(); }
}
