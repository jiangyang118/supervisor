import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TrainingService, QuestionType } from './training.service';

@Controller('school/training')
export class TrainingController {
  constructor(private readonly svc: TrainingService) {}

  // Courses
  @Get('courses') listCourses(@Query('schoolId') schoolId?: string) {
    const sid = schoolId || 'sch-001';
    return this.svc.listCourses({ schoolId: sid });
  }
  @Post('courses') createCourse(@Body() b: { title: string; desc?: string; schoolId?: string }) {
    return this.svc.createCourse(b);
  }
  @Patch('courses') updateCourse(
    @Query('id') id: string,
    @Body() b: { title?: string; desc?: string; status?: '进行中' | '已归档' },
  ) {
    return this.svc.updateCourse(id, b);
  }
  @Post('courses/delete') deleteCourse(@Body() b: { id: string }) {
    return this.svc.deleteCourse(b.id);
  }

  // Exams
  @Get('exams') listExams(
    @Query('courseId') courseId?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    const sid = schoolId || 'sch-001';
    return this.svc.listExams({ courseId, schoolId: sid });
  }
  @Post('exams') createExam(
    @Body()
    b: {
      title: string;
      courseId?: string;
      shuffle?: boolean;
      showScore?: boolean;
      showAnswers?: boolean;
      showAnalysis?: boolean;
      passScore?: number;
    },
  ) {
    return this.svc.createExam(b);
  }
  @Patch('exams') updateExam(
    @Query('id') id: string,
    @Body()
    b: {
      title?: string;
      courseId?: string;
      shuffle?: boolean;
      showScore?: boolean;
      showAnswers?: boolean;
      showAnalysis?: boolean;
      passScore?: number;
    },
  ) {
    return this.svc.updateExam(id, b);
  }
  @Patch('exams/status') setExamStatus(
    @Query('id') id: string,
    @Body() b: { status: '未开始' | '进行中' | '已结束' },
  ) {
    return this.svc.setExamStatus(id, b.status);
  }
  @Post('exams/delete') deleteExam(@Body() b: { id: string }) {
    return this.svc.deleteExam(b.id);
  }

  // Questions
  @Get('questions') listQuestions(@Query('examId') examId: string) {
    return this.svc.listQuestions(examId);
  }
  @Post('questions') addQuestion(
    @Body()
    b: {
      examId: string;
      type: QuestionType;
      stem: string;
      options?: { key: string; text: string }[];
      answer: string[];
      analysis?: string;
      score?: number;
    },
  ) {
    return this.svc.addQuestion(b);
  }
  @Patch('questions') updateQuestion(
    @Query('id') id: string,
    @Body()
    b: {
      type?: QuestionType;
      stem?: string;
      options?: { key: string; text: string }[];
      answer?: string[];
      analysis?: string;
      score?: number;
    },
  ) {
    return this.svc.updateQuestion(id, b);
  }
  @Post('questions/delete') deleteQuestion(@Body() b: { id: string }) {
    return this.svc.deleteQuestion(b.id);
  }
  @Post('questions/import') importQuestions(
    @Body()
    b: {
      examId: string;
      items: {
        type: QuestionType;
        stem: string;
        options?: { key: string; text: string }[];
        answer: string[];
        analysis?: string;
        score?: number;
      }[];
    },
  ) {
    return this.svc.importQuestions(b);
  }

  // Submission and results
  @Post('submit') submit(
    @Body()
    b: {
      examId: string;
      user: string;
      answers: Record<string, string[]>;
      schoolId?: string;
    },
  ) {
    return this.svc.submit(b);
  }
  @Get('results') listResults(
    @Query('examId') examId?: string,
    @Query('user') user?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    const sid = schoolId || 'sch-001';
    return this.svc.listResults({ examId, user, schoolId: sid });
  }
  @Get('results/export.csv') exportResults(
    @Query('examId') examId?: string,
    @Query('user') user?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    const items = this.svc.listResults({ examId, user, schoolId });
    const headers = ['id', 'schoolId', 'examId', 'user', 'score', 'passed', 'submittedAt'];
    const rows = items.map((r: any) => [
      r.id,
      r.schoolId || '',
      r.examId,
      r.user,
      r.score,
      r.passed ? '1' : '0',
      r.submittedAt,
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
  }

  // Notifications (simulated)
  @Post('notify') notify(
    @Body() b: { examId: string; channel: 'sms' | 'app' | 'email'; to: string },
  ) {
    return this.svc.notify(b);
  }
  @Get('notifications') notifications(@Query('examId') examId?: string) {
    return this.svc.listNotifications({ examId });
  }

  @Get('courses/export.csv')
  exportCoursesCsv(@Query('schoolId') schoolId?: string) {
    const sid = schoolId || 'sch-001';
    const items = this.svc.listCourses({ schoolId: sid });
    const headers = ['id', 'schoolId', 'title', 'desc', 'status', 'createdAt'];
    const rows = items.map((r: any) => [
      r.id,
      r.schoolId || '',
      r.title,
      r.desc || '',
      r.status,
      r.createdAt,
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
  }

  @Get('exams/export.csv')
  exportExamsCsv(@Query('courseId') courseId?: string, @Query('schoolId') schoolId?: string) {
    const sid = schoolId || 'sch-001';
    const items = this.svc.listExams({ courseId, schoolId: sid });
    const headers = [
      'id',
      'schoolId',
      'courseId',
      'title',
      'shuffle',
      'showScore',
      'showAnswers',
      'showAnalysis',
      'passScore',
      'status',
      'createdAt',
    ];
    const rows = items.map((r: any) => [
      r.id,
      r.schoolId || '',
      r.courseId || '',
      r.title,
      r.shuffle ? '1' : '0',
      r.showScore ? '1' : '0',
      r.showAnswers ? '1' : '0',
      r.showAnalysis ? '1' : '0',
      r.passScore,
      r.status,
      r.createdAt,
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
  }

  @Get('notifications/export.csv')
  exportNotificationsCsv(@Query('examId') examId?: string) {
    const items = this.svc.listNotifications({ examId });
    const headers = ['id', 'examId', 'channel', 'to', 'sentAt'];
    const rows = items.map((r: any) => [r.id, r.examId, r.channel, r.to, r.sentAt]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return { csv };
  }

  @Sse('stream') stream(): Observable<MessageEvent> {
    return this.svc.stream();
  }
}
