from pathlib import Path
p=Path(''src/bookings/bookings.controller.ts'')
text=p.read_text(encoding=''utf-8'')
old='''  async complete(@Req() req: Request, @Param(''id'') id: string) {
    const userId = req.user[''userId''];
    const booking = await this.bookingsService.completeService(id, userId);
    return new BookingDetailsDto(booking);
  }
'''
new='''  async complete(@Req() req: Request, @Param(''id'') id: string) {
    const userId = req.user[''userId''];
    const booking = await this.bookingsService.completeService(id, userId);
    return new BookingDetailsDto(booking);
  }

  @Post(''auto-complete-overdue'')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      ''Auto-completar bookings IN_PROGRESS cujo horário final já passou e estão pagos'',
  })
  async autoCompleteOverdue() {
    return this.bookingsService.autoCompleteOverdueBookings();
  }
'''
p.write_text(text.replace(old,new), encoding=''utf-8'')
