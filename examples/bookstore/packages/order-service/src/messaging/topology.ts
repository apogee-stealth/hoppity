import { buildServiceTopology } from "@apogeelabs/hoppity-contracts";
import { BrokerConfig } from "rascal";
import { Orders } from "@bookstore/contracts";
import { config } from "../config";

const baseTopology: BrokerConfig = {
    vhosts: {
        [config.rabbitmq.vhost]: {
            connection: {
                url: config.rabbitmq.url,
                options: { heartbeat: 10 },
                retry: { factor: 2, min: 1000, max: 5000 },
            },
        },
    },
};

export const topology = buildServiceTopology(baseTopology, "order-service", t => {
    t.respondsToRpc(Orders.rpc.createOrder);
    t.respondsToRpc(Orders.rpc.getOrderSummary);
    t.handlesCommand(Orders.commands.cancelOrder);
    t.publishesEvent(Orders.events.orderCreated);
    t.publishesEvent(Orders.events.orderCancelled);
});
