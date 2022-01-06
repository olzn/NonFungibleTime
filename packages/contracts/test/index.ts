import { expect } from 'chai';
import { ethers } from 'hardhat';
import { TimeCollection } from '../typechain/TimeCollection.d';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { TestToken } from 'contracts/typechain';
import { BigNumber } from 'ethers';

describe('Tokenized time collection', () => {
  let timeContract: TimeCollection;
  let owner: SignerWithAddress;
  let minter: SignerWithAddress;
  let otherAccount: SignerWithAddress;
  let buyer: SignerWithAddress;
  let testToken: TestToken;

  beforeEach(async () => {
    const TimeCollectionFactory = await ethers.getContractFactory('TimeCollection');
    const TestTokenFactory = await ethers.getContractFactory('TestToken');
    [owner, otherAccount, buyer] = await ethers.getSigners();
    minter = owner;
    timeContract = await TimeCollectionFactory.deploy('Tokenized Time', 'TTime', false);
    testToken = await TestTokenFactory.deploy();
  });

  it('Should initialize the Tokenized Time contract', async () => {
    expect(await timeContract.name()).to.equal('Tokenized Time');
  });

  it('Should set the right owner', async () => {
    expect(await timeContract.owner()).to.equal(await owner.address);
  });

  it('Should mint a NFT with the correct metadata', async () => {
    await timeContract.mint(
      'One dev hour v1',
      'One development hour to be used for any dao',
      'Development',
      1641342727,
      1651342727,
      10000000,
      300
    );
    expect(await timeContract.tokens(0)).to.eql([
      BigNumber.from(1641342727),
      BigNumber.from(1651342727),
      BigNumber.from(10000000),
      ethers.constants.Zero,
      BigNumber.from(300),
      minter.address,
      ethers.constants.AddressZero,
      false,
      false,
      'One dev hour v1',
      'One development hour to be used for any dao',
      'Development',
    ]);
  });

  it('Should success when mint an NFT with duration matching availability range duration', async () => {
    let availabilityFrom = 1641342727;
    let availabilityTo = 1651342727;
    let duration = availabilityTo - availabilityFrom;
    expect(duration).to.be.equals(availabilityTo - availabilityFrom);
    await timeContract.mint(
      'One dev hour v1',
      'One development hour to be used for any dao',
      'Development',
      availabilityFrom,
      availabilityTo,
      duration,
      300
    );
  });

  it('Should success when mint an NFT with duration being less than availability range duration', async () => {
    let availabilityFrom = 1641342727;
    let availabilityTo = 1651342727;
    let duration = 1000;
    expect(duration).to.be.lessThan(availabilityTo - availabilityFrom);
    await timeContract.mint(
      'One dev hour v1',
      'One development hour to be used for any dao',
      'Development',
      availabilityFrom,
      availabilityTo,
      duration,
      300
    );
  });

  it('Should success when mint an NFT without availability range', async () => {
    let availabilityFrom = 0;
    let availabilityTo = 0;
    let duration = 10000000;
    expect(availabilityFrom).to.be.equals(0);
    expect(availabilityTo).to.be.equals(0);
    expect(duration).to.be.greaterThan(0);
    await timeContract.mint(
      'One dev hour v1',
      'One development hour to be used for any dao',
      'Development',
      availabilityFrom,
      availabilityTo,
      duration,
      300
    );
  });

  it('Should success when mint an NFT without lower availability range', async () => {
    let availabilityFrom = 0;
    let availabilityTo = 1651342727;
    let duration = 100000;
    expect(availabilityTo).to.be.greaterThan(0);
    expect(availabilityFrom).to.be.equals(0);
    await timeContract.mint(
      'One dev hour v1',
      'One development hour to be used for any dao',
      'Development',
      availabilityFrom,
      availabilityTo,
      duration,
      300
    );
  });

  it('Should success when mint an NFT without upper availability range', async () => {
    let availabilityFrom = 1641342727;
    let availabilityTo = 0;
    let duration = 100000;
    expect(availabilityFrom).to.be.greaterThan(0);
    expect(availabilityTo).to.be.equals(0);
    await timeContract.mint(
      'One dev hour v1',
      'One development hour to be used for any dao',
      'Development',
      availabilityFrom,
      availabilityTo,
      duration,
      300
    );
  });

  it('Should revert when mint an NFT with zero duration', async () => {
    let availabilityFrom = 1641342727;
    let availabilityTo = 1651342727;
    let duration = 0;
    expect(availabilityFrom).to.be.greaterThan(0);
    expect(availabilityTo).to.be.greaterThan(0);
    expect(duration).to.be.equals(0);
    await expect(
      timeContract.mint(
        'One dev hour v1',
        'One development hour to be used for any dao',
        'Development',
        availabilityFrom,
        availabilityTo,
        duration,
        300
      )
    ).to.be.revertedWith('InvalidTimeParams()');
    availabilityFrom = 0;
    availabilityTo = 0;
    expect(availabilityFrom).to.be.equals(0);
    expect(availabilityTo).to.be.equals(0);
    expect(duration).to.be.equals(0);
    await expect(
      timeContract.mint(
        'One dev hour v1',
        'One development hour to be used for any dao',
        'Development',
        availabilityFrom,
        availabilityTo,
        duration,
        300
      )
    ).to.be.revertedWith('InvalidTimeParams()');
  });

  it('Should revert when mint an NFT with duration greater than availability range', async () => {
    let availabilityFrom = 1641342727;
    let availabilityTo = 1651342727;
    let duration = availabilityTo - availabilityFrom + 1;
    expect(duration).to.be.greaterThan(availabilityTo - availabilityFrom);
    await expect(
      timeContract.mint(
        'One dev hour v1',
        'One development hour to be used for any dao',
        'Development',
        availabilityFrom,
        availabilityTo,
        duration,
        300
      )
    ).to.be.revertedWith('InvalidTimeParams()');
  });

  it('Should revert when mint an NFT with availability range with an upper bound less than the lower one', async () => {
    let availabilityFrom = 1600000000;
    let availabilityTo = 1400000000;
    let duration = 100;
    expect(availabilityFrom).to.be.greaterThan(availabilityTo);
    await expect(
      timeContract.mint(
        'One dev hour v1',
        'One development hour to be used for any dao',
        'Development',
        availabilityFrom,
        availabilityTo,
        duration,
        300
      )
    ).to.be.revertedWith('InvalidTimeParams()');
  });

  it('Should revert if you try to put on sale a NFT with an unallowed currency', async () => {
    await timeContract.mint(
      'One dev hour v1',
      'One development hour to be used for any dao',
      'Development',
      1641342727,
      1651342727,
      10000000,
      300
    );
    await expect(timeContract.toggleForSale(ethers.BigNumber.from(0))).to.be.revertedWith(
      'UnallowedCurrency(0, "0x0000000000000000000000000000000000000000")'
    );
  });

  it('Should revert if you try to whitelist a currency and you are not the owner', async () => {
    await expect(
      timeContract.connect(otherAccount).toggleCurrencyAllowance(testToken.address)
    ).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('Should whitelist a currency to use as payment if you are the owner', async () => {
    await timeContract.toggleCurrencyAllowance(testToken.address);
    expect(await timeContract.isCurrencyAllowed(testToken.address)).to.be.true;
  });

  it('Should revert if you try to change token buying conditions and you are not the owner', async () => {
    await timeContract.mint(
      'One dev hour v1',
      'One development hour to be used for any dao',
      'Development',
      1641342727,
      1651342727,
      10000000,
      300
    );
    await expect(
      timeContract
        .connect(otherAccount)
        .changeTokenBuyingConditions(ethers.constants.Zero, testToken.address, ethers.constants.One)
    ).to.be.revertedWith('OnlyTokenOwner');
  });

  it('Should change token buying conditions', async () => {
    await timeContract.mint(
      'One dev hour v1',
      'One development hour to be used for any dao',
      'Development',
      1641342727,
      1651342727,
      10000000,
      300
    );

    await timeContract.toggleCurrencyAllowance(testToken.address);
    await timeContract.changeTokenBuyingConditions(
      ethers.constants.Zero,
      testToken.address,
      ethers.constants.One
    );

    expect(await timeContract.tokens(0)).to.eql([
      BigNumber.from(1641342727),
      BigNumber.from(1651342727),
      BigNumber.from(10000000),
      ethers.constants.One,
      BigNumber.from(300),
      minter.address,
      testToken.address,
      false,
      false,
      'One dev hour v1',
      'One development hour to be used for any dao',
      'Development',
    ]);
  });

  it('Should revert if you try to toggle from sale and you are not the owner', async () => {
    await timeContract.mint(
      'One dev hour v1',
      'One development hour to be used for any dao',
      'Development',
      1641342727,
      1651342727,
      10000000,
      300
    );
    await expect(
      timeContract.connect(otherAccount).toggleForSale(ethers.BigNumber.from(0))
    ).to.be.revertedWith('OnlyTokenOwner(0)');
  });

  it('Should toggle for sale if you are the token owner', async () => {
    await timeContract.mint(
      'One dev hour v1',
      'One development hour to be used for any dao',
      'Development',
      1641342727,
      1651342727,
      10000000,
      300
    );
    await timeContract.toggleCurrencyAllowance(testToken.address);
    await timeContract.changeTokenBuyingConditions(
      ethers.constants.Zero,
      testToken.address,
      ethers.constants.One
    );
    await timeContract.toggleForSale(ethers.BigNumber.from(0));
    expect(await (await timeContract.tokens(0)).forSale).to.be.true;
  });

  it('Should redeem an NFT if you are the owner of it', async () => {
    await timeContract.mint(
      'One dev hour v1',
      'One development hour to be used for any dao',
      'Development',
      1641342727,
      1651342727,
      10000000,
      300
    );
    await timeContract.redeem(ethers.BigNumber.from(0));
    expect(await (await timeContract.tokens(0)).redeemed).to.be.true;
  });

  it('Should revert the NFT redeem if you are not the owner of it', async () => {
    await timeContract.mint(
      'One dev hour v1',
      'One development hour to be used for any dao',
      'Development',
      1641342727,
      1651342727,
      10000000,
      300
    );
    await expect(
      timeContract.connect(otherAccount).redeem(ethers.BigNumber.from(0))
    ).to.be.revertedWith('OnlyTokenOwner(0)');
  });

  it('Should revert a redeem transaction if the NFT is already redeemed', async () => {
    await timeContract.mint(
      'One dev hour v1',
      'One development hour to be used for any dao',
      'Development',
      1641342727,
      1651342727,
      10000000,
      300
    );
    await timeContract.redeem(ethers.BigNumber.from(0));
    await expect(timeContract.redeem(ethers.BigNumber.from(0))).to.be.revertedWith(
      'AlreadyRedeemed(0)'
    );
  });

  it('Should revert a buyToken transaction because the token is not for sale', async () => {
    await timeContract.mint(
      'One dev hour v1',
      'One development hour to be used for any dao',
      'Development',
      1641342727,
      1651342727,
      10000000,
      300
    );
    await timeContract.toggleCurrencyAllowance(testToken.address);
    await timeContract.changeTokenBuyingConditions(
      ethers.constants.Zero,
      testToken.address,
      ethers.constants.One
    );
    await expect(timeContract.connect(buyer).buyToken(ethers.constants.Zero)).to.be.revertedWith(
      'NotForSale(0)'
    );
  });

  it("Should revert a buyToken transaction because the buyer doesn't have enough funds", async () => {
    await timeContract.mint(
      'One dev hour v1',
      'One development hour to be used for any dao',
      'Development',
      1641342727,
      1651342727,
      10000000,
      300
    );
    await timeContract.toggleCurrencyAllowance(testToken.address);
    await timeContract.changeTokenBuyingConditions(
      ethers.constants.Zero,
      testToken.address,
      ethers.constants.One
    );
    await timeContract.toggleForSale(ethers.constants.Zero);
    await expect(timeContract.connect(buyer).buyToken(ethers.constants.Zero)).to.be.revertedWith(
      'NotEnoughFunds'
    );
  });

  it('Should revert the transaction if someone is trying to buy his own token', async () => {
    await timeContract.mint(
      'One dev hour v1',
      'One development hour to be used for any dao',
      'Development',
      1641342727,
      1651342727,
      10000000,
      300
    );
    await timeContract.toggleCurrencyAllowance(testToken.address);
    await timeContract.changeTokenBuyingConditions(
      ethers.constants.Zero,
      testToken.address,
      ethers.constants.One
    );
    await timeContract.toggleForSale(ethers.constants.Zero);
    await expect(timeContract.buyToken(ethers.constants.Zero)).to.be.revertedWith(
      `CantBuyYourOwnToken("${minter.address}", 0)`
    );
  });

  it('Should buy a token from someone if you have enough funds', async () => {
    await timeContract.mint(
      'One dev hour v1',
      'One development hour to be used for any dao',
      'Development',
      1641342727,
      1651342727,
      10000000,
      300
    );
    await timeContract.toggleCurrencyAllowance(testToken.address);
    await timeContract.changeTokenBuyingConditions(
      ethers.constants.Zero,
      testToken.address,
      ethers.constants.One
    );
    await timeContract.toggleForSale(ethers.constants.Zero);
    await testToken.connect(buyer).mint(ethers.BigNumber.from(100));
    await testToken
      .connect(buyer)
      .increaseAllowance(timeContract.address, ethers.BigNumber.from(100));
    await timeContract.connect(buyer).buyToken(ethers.constants.Zero);
    expect(await testToken.balanceOf(buyer.address)).to.equal(ethers.BigNumber.from(99));
    expect(await testToken.balanceOf(minter.address)).to.equal(ethers.constants.One);
    expect(await timeContract.ownerOf(ethers.constants.Zero)).to.equal(buyer.address);
  });

  it('Should buy a token and give royalties to the minter', async () => {
    await timeContract.connect(owner).toggleCurrencyAllowance(testToken.address);
    await timeContract
      .connect(minter)
      .mint(
        'One dev hour v1',
        'One development hour to be used for any dao',
        'Development',
        1641342727,
        1651342727,
        10000000,
        1000
      );
    await timeContract
      .connect(minter)
      .transferFrom(minter.address, otherAccount.address, ethers.constants.Zero);
    await timeContract
      .connect(otherAccount)
      .changeTokenBuyingConditions(
        ethers.constants.Zero,
        testToken.address,
        ethers.BigNumber.from(100)
      );
    await timeContract.connect(otherAccount).toggleForSale(ethers.constants.Zero);
    await testToken.connect(buyer).mint(ethers.BigNumber.from(100));
    await testToken
      .connect(buyer)
      .increaseAllowance(timeContract.address, ethers.BigNumber.from(100));
    await timeContract.connect(buyer).buyToken(ethers.constants.Zero);
    expect(await testToken.balanceOf(buyer.address)).to.equal(ethers.constants.Zero);
    expect(await testToken.balanceOf(minter.address)).to.equal(ethers.BigNumber.from(10));
    expect(await testToken.balanceOf(otherAccount.address)).to.equal(ethers.BigNumber.from(90));
    expect(await timeContract.ownerOf(ethers.constants.Zero)).to.equal(buyer.address);
  });
});