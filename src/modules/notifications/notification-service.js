import admin from '../../config/firebase-admin.js';

const ADMIN_NOTIFICATION_TOPIC = 'admin_notifications';

class NotificationService {
  async sendNotificationToAdmins(title, body, data = {}) {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      topic: ADMIN_NOTIFICATION_TOPIC,
      data: data,
    };

    try {
      const response = await admin.messaging().send(message);
      console.log(
        `Notificação "${title}" enviada para o tópico ${ADMIN_NOTIFICATION_TOPIC}. Message ID: ${response}`
      );
    } catch (error) {
      console.error(
        `Erro ao enviar notificação para o tópico ${ADMIN_NOTIFICATION_TOPIC}:`,
        error
      );
      // Não relance o erro aqui para não quebrar o fluxo chamador (appointment-service)
    }
  }

  async notifyNewAppointment(appointment, clientName) {
    const title = 'Novo Agendamento Confirmado!';

    // --- AJUSTE 3: Formate a data/hora aqui ---
    let body = `${clientName} fez um novo agendamento.`; // Mensagem padrão
    try {
      if (appointment && appointment.startTime) {
        const appointmentTime = new Date(
          appointment.startTime
        ).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo',
        });
        const appointmentDate = new Date(
          appointment.startTime
        ).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        body = `${clientName} agendou para ${appointmentDate} às ${appointmentTime}.`;
      }
    } catch (e) {
      console.error('Erro ao formatar data/hora para notificação:', e);
    }
    // --- FIM DO AJUSTE 3 ---

    const data = {
      type: 'NEW_APPOINTMENT',
      appointmentId: appointment?._id?.toString(), // Adiciona verificação
      // Adicione a URL se quiser que a notificação abra uma página específica
      // url: `/backoffice/appointments/${appointment?._id?.toString()}`
    };

    await this.sendNotificationToAdmins(title, body, data);
  }

  async notifyLowStock(variant, productName) {
    const title = 'Alerta de Estoque Baixo!';
    let body = `Estoque baixo para "${productName}"`; // Padrão
    try {
      if (variant) {
        body = `O produto "${productName}" (Cor: ${variant.color}, Tam: ${variant.size}) está com apenas ${variant.quantity} unidade(s) em estoque.`;
      }
    } catch (e) {
      console.error('Erro ao formatar mensagem de estoque baixo:', e);
    }
    const data = {
      type: 'LOW_STOCK',
      variantId: variant?._id?.toString(),
      productId: variant?.product?.toString(),
    };
    await this.sendNotificationToAdmins(title, body, data);
  }

  async notifyProductLiked(clientName, productName) {
    const title = 'Produto Selecionado!';
    const body = `${clientName} selecionou "${productName}" para a visita.`;
    const data = {
      type: 'PRODUCT_LIKED',
      // Adicione IDs se necessário para links
    };
    await this.sendNotificationToAdmins(title, body, data);
  }
}

export default new NotificationService();
