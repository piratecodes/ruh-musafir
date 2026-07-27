import { Controller, Post, Request, Get, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// ALL POS operations require strict authorization
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * PLACE A NEW ORDER
   * Trigger: POST http://localhost:3001/api/v1/orders
   * Takes the cart items from the frontend, securely checks the user's role from the JWT,
   * and routes the order to the kitchen.
   */
  @Post()
  async placeOrder(
    // THE FIX: Added 'payment' to the expected Body payload so the backend catches UPI/CASH/ROOM_TAB
    @Body() orderData: { 
      items: { menuItemId: string; quantity: number }[], 
      bookingId?: string, 
      payment?: string, 
      walkInFirstName?: string, 
      walkInLastName?: string, 
      walkInPhone?: string 
    },
    @Request() req // Extracts the decoded JWT payload automatically
  ) {
    // We pass the User ID and Role securely from the token, preventing spoofing
    const order = await this.ordersService.createOrder(orderData, req.user.sub, req.user.role);
    return { success: true, message: 'Order sent to kitchen!', data: order };
  }

  /**
   * FETCH KITCHEN LEDGER
   * Trigger: GET http://localhost:3001/api/v1/orders/active
   * Retrieves all orders that are not yet marked as 'PAID' for the Kitchen/POS display.
   */
  @Get('active')
  async getActiveTickets() {
    const orders = await this.ordersService.findAllActiveOrders();
    return { success: true, count: orders.length, data: orders };
  }

  /**
   * UPDATE TICKET STATUS
   * Trigger: PATCH http://localhost:3001/api/v1/orders/{id}/status
   * Moves a ticket through the pipeline (PENDING -> PREPARING -> SERVED -> PAID)
   * THE FIX: Now safely accepts the payment method (CASH, UPI, CARD)
   */
  @Patch(':id/status')
  async updateTicketStatus(
    @Param('id') id: string, 
    @Body() body: { status: string; method?: string }
  ) {
    // Pass the method to the service. Default to CASH if none provided.
    const updatedOrder = await this.ordersService.updateStatus(id, body.status, body.method || 'CASH');
    return { success: true, message: `Order marked as ${body.status}`, data: updatedOrder };
  }

  // Trigger: PATCH http://localhost:3001/api/v1/orders/{id}/cancel
  @Patch(':id/cancel')
  async cancelTicket(@Param('id') id: string, @Request() req) {
    // THE FIX: Passed req.user.role to the service
    await this.ordersService.cancelOrder(id, req.user.role); 
    return { success: true, message: 'Ticket cancelled successfully.' };
  }

  // Trigger: PATCH http://localhost:3001/api/v1/orders/{id}
  @Patch(':id')
  async editTicket(@Param('id') id: string, @Body() orderData: any, @Request() req) {
    // THE FIX: Passed req.user.role to the service
    const updated = await this.ordersService.updateOrder(id, orderData, req.user.role); 
    return { success: true, message: 'Ticket updated successfully!', data: updated };
  }

  @Get('lookup/:phone')
  async lookupWalkInCustomer(@Param('phone') phone: string) {
    const customer = await this.ordersService.findWalkInByPhone(phone);
    return { success: true, data: customer };
  }

  // Trigger: DELETE http://localhost:3001/api/v1/orders/{id}
  @Delete(':id')
  async deleteOrder(@Param('id') id: string, @Request() req) {
    // THE FIX: Passed req.user.role to the service
    await this.ordersService.deleteOrder(id, req.user.role); 
    return { success: true, message: 'Order permanently deleted from database.' };
  }

  // Trigger: GET http://localhost:3001/api/v1/orders?range=last7days
  @Get('ledger') // Notice it's /orders/ledger, not just /orders
  async getLedgerOrders(@Query('range') range?: string) {
    const orders = await this.ordersService.getLedgerOrders(range);
    return { success: true, count: orders.length, data: orders };
  }
}