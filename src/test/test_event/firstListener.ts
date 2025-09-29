// https://www.digitalocean.com/community/tutorials/using-event-emitters-in-node-js

import { TicketManager } from "./ticketManager";

const ticketManager = new TicketManager(10);

ticketManager.on("buy", () => {
  console.log("Someone bought a ticket!");
});

ticketManager.buy("test@email.com", 20);
ticketManager.buy("test@email.com", 20);

ticketManager.once("buy", () => {
  console.log("This is only called once");
});

ticketManager.buy("test@email.com", 20);
ticketManager.buy("test@email.com", 20);
ticketManager.buy("test@email.com", 20);
ticketManager.buy("test@email.com", 20);