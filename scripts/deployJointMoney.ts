import { toNano } from '@ton/core';
import { JointMoney } from '../wrappers/JointMoney';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const jointMoney = provider.open(
        JointMoney.createFromConfig(
            {
                id: Math.floor(Math.random() * 10000),
                counter: 0,
            },
            await compile('JointMoney')
        )
    );

    await jointMoney.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(jointMoney.address);

    console.log('ID', await jointMoney.getID());
}
