import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { JointMoney } from '../wrappers/JointMoney';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('JointMoney', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('JointMoney');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let jointMoney: SandboxContract<JointMoney>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        jointMoney = blockchain.openContract(
            JointMoney.createFromConfig(
                {
                    id: 0,
                    counter: 0,
                },
                code,
            ),
        );

        deployer = await blockchain.treasury('deployer');

        const deployResult = await jointMoney.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jointMoney.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and jointMoney are ready to use
    });

    it('just send message', async () => {
        console.log('from addr', deployer.getSender().address.toRawString());

        await jointMoney.sendCreateGroup(deployer.getSender(), {
            value: toNano('0.05'),
        });

        const group = await jointMoney.getGroupById(1n);

        console.log({ group });
    });
});
