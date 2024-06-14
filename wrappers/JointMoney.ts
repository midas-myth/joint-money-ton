import {
    Address,
    beginCell,
    BitString,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
} from '@ton/core';

export type JointMoneyConfig = {};

export function jointMoneyConfigToCell(config: JointMoneyConfig): Cell {
    return beginCell().storeUint(0, 32).storeDict().endCell();
}

export const Opcodes = {
    createGroup: 0x1,
    deposit: 0x2,
    withdraw: 0x3,
};

export class JointMoney implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new JointMoney(address);
    }

    static createFromConfig(config: JointMoneyConfig, code: Cell, workchain = 0) {
        const data = jointMoneyConfigToCell(config);
        const init = { code, data };
        return new JointMoney(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendCreateGroup(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryID?: number;
        },
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.createGroup, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(
                    beginCell()
                        .storeBits(new BitString(Buffer.from('hello', 'ascii'), 0, 350))
                        .endCell(),
                )
                .storeCoins(0)
                .storeMaybeRef()
                .endCell(),
        });
    }

    async sendDeposit(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryID?: number;
        },
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.deposit, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .endCell(),
        });
    }

    async sendWithdraw(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryID?: number;
        },
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.withdraw, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .endCell(),
        });
    }

    async getGroupById(provider: ContractProvider, id: bigint) {
        const result = await provider.get('get_group_by_id', [
            {
                type: 'int',
                value: id,
            },
        ]);

        const returnedId = result.stack.readNumber();

        const nameParser = result.stack.readCell().beginParse();
        let name = nameParser.loadBits(350).toString();
        name = Buffer.from(name, 'hex')
            .toString('ascii')
            .replace(/\x00*\x02$/, '');
        nameParser.endParse();

        const balance = result.stack.readBigNumber();
        return { id: returnedId, name, balance };
    }
}
