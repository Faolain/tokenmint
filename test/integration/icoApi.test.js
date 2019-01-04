/*jshint esversion: 6 */
import { assert, expect } from 'chai';
import Web3 from 'web3';
const icoApi = require('../../src/api/icoApi');
import fetch from 'node-fetch';
import { BigNumber } from 'bignumber.js';
import TokenMintERC20TokenJSON from '../../src/contracts/TokenMintERC20Token.json';
import CrowdsaleJSON from '../../src/contracts/Crowdsale.json';
import AllowanceCrowdsaleImplJSON from '../../src/contracts/AllowanceCrowdsaleImpl.json';
import TCACrowdsaleJSON from '../../src/contracts/TCACrowdsale.json';
import CARPDCrowdsaleJSON from '../../src/contracts/CARPDCrowdsale.json';



let web3, accounts;
let tokenMintAccount = "0x6603cb70464ca51481d4edBb3B927F66F53F4f42";
let icoMaker, investor1, investor2, investor3;
let tommorowDate = new Date(new Date().setDate(new Date().getDate() + 1));
let tommorow = Math.round(tommorowDate.getTime() / 1000);
let startTime = Math.round((new Date().getTime() + 2000) / 1000); // 2 seconds in future
let endTime = Math.round((new Date().getTime() + 6000) / 1000); // 6 seconds in future
let tokenArgs = ["Token name", "SYM", 18, 1000, tokenMintAccount, icoMaker];

describe('TokenMint icoApi integration tests', function () {
  this.timeout(30000);

  before((beforeDone) => {
    // set global fetch because node doesn't have it
    global.fetch = fetch;
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    web3.eth.getAccounts().then(allAccounts => {
      accounts = allAccounts;
      icoMaker = accounts[0];
      investor1 = accounts[1];
      investor2 = accounts[2];
      investor3 = accounts[3];
      tokenArgs[5] = icoMaker
      beforeDone();
    });
  });

  beforeEach((done) => {
    icoApi.initWeb3();
    startTime = Math.round((new Date().getTime() + 2000) / 1000); // 2 seconds in future
    endTime = Math.round((new Date().getTime() + 6000) / 1000); // 6 seconds in future
    done();
  });

  it('Deploy Token contract', (done) => {
    let tokenArgs = ["Name", "SYM", 18, 1000, tokenMintAccount, icoMaker];
    icoApi.deployCrowdsaleToken(accounts[0], ...tokenArgs).then(receipt => {
      expect(receipt.status).to.be.eq(true);
      done();
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('Deploy Crowdsale contract', (done) => {
    let crowdsaleArgs = [500, icoMaker];
    icoApi.deployCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {
      expect(receipts.tokenReceipt.status).to.be.eq(true);
      expect(receipts.crowdsaleReceipt.status).to.be.eq(true);
      done();
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('Deploy AllowanceCrowdsale contract', (done) => {
    let crowdsaleArgs = [500, icoMaker];
    icoApi.deployAllowanceCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {
      expect(receipts.tokenReceipt.status).to.be.eq(true);
      expect(receipts.crowdsaleReceipt.status).to.be.eq(true);
      done();
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('Deploy TCACrowdsale contract', (done) => {
    let crowdsaleArgs = [startTime, endTime, 500, icoMaker, null, web3.utils.toWei('1', 'ether'), icoMaker];
    icoApi.deployTCACrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {
      expect(receipts.tokenReceipt.status).to.be.eq(true);
      expect(receipts.crowdsaleReceipt.status).to.be.eq(true);
      done();
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('Deploy CARPDCrowdsale contract', (done) => {
    let crowdsaleArgs = [startTime, endTime, 500, icoMaker, null, web3.utils.toWei('1', 'ether'), web3.utils.toWei('0.1', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {
      expect(receipts.tokenReceipt.status).to.be.eq(true);
      expect(receipts.crowdsaleReceipt.status).to.be.eq(true);
      done();
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('Crowdsale invest - using buyTokens', (done) => {
    let crowdsaleArgs = [1000, icoMaker];
    icoApi.deployCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {
      expect(receipts.tokenReceipt.status).to.be.eq(true);
      expect(receipts.crowdsaleReceipt.status).to.be.eq(true);

      // transfer all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.transfer(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(success => {
        // call buyTokens function of Crowdsale contract
        let contractInstance = new web3.eth.Contract(CrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
        contractInstance.methods.buyTokens(investor1).send({ from: investor1, gas: 4712388, value: web3.utils.toWei('0.02', 'ether') }).then(r => {
          // check token balance after investment
          icoApi.getTokenBalance(tokenInstance, investor1).then(actualTokenBalance => {
            expect(parseInt(actualTokenBalance)).to.be.eq(20);
            done();
          }).catch(e => {
            done(new Error(e));
          });
        }).catch(e => {
          done(new Error(e));
        });
      }).catch((e) => {
        done(new Error(e));
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('Crowdsale invest - using sendTransaction', (done) => {
    let crowdsaleArgs = [1000, icoMaker];
    icoApi.deployCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {
      expect(receipts.tokenReceipt.status).to.be.eq(true);
      expect(receipts.crowdsaleReceipt.status).to.be.eq(true);

      // transfer all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.transfer(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(success => {
        // buy tokens by sending money to Crowdsale contract address (regular value tx)
        web3.eth.sendTransaction({ from: investor1, to: receipts.crowdsaleReceipt.contractAddress, gas: 4712388, value: web3.utils.toWei('0.03', 'ether') }).then(r => {
          // check token balance after investment
          icoApi.getTokenBalance(tokenInstance, investor1).then(actualTokenBalance => {
            expect(parseInt(actualTokenBalance)).to.be.eq(30);
            done();
          }).catch(e => {
            done(new Error(e));
          });
        }).catch(e => {
          done(new Error(e));
        });
      }).catch((e) => {
        done(new Error(e));
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('AllowanceCrowdsaleImpl invest - using buyTokens', (done) => {
    let crowdsaleArgs = [1000, icoMaker];
    icoApi.deployAllowanceCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {
      expect(receipts.tokenReceipt.status).to.be.eq(true);
      expect(receipts.crowdsaleReceipt.status).to.be.eq(true);

      // approve all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.approve(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(success => {
        // call buyTokens function of Crowdsale contract
        let contractInstance = new web3.eth.Contract(AllowanceCrowdsaleImplJSON.abi, receipts.crowdsaleReceipt.contractAddress);
        contractInstance.methods.buyTokens(investor1).send({ from: investor1, gas: 4712388, value: web3.utils.toWei('0.02', 'ether') }).then(r => {
          // check token balance after investment
          icoApi.getTokenBalance(tokenInstance, investor1).then(actualTokenBalance => {
            expect(parseInt(actualTokenBalance)).to.be.eq(20);
            done();
          }).catch(e => {
            done(new Error(e));
          });
        }).catch(e => {
          done(new Error(e));
        });
      }).catch((e) => {
        done(new Error(e));
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('AllowanceCrowdsaleImpl invest - using sendTransaction', (done) => {
    let crowdsaleArgs = [1000, icoMaker];
    icoApi.deployAllowanceCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {
      expect(receipts.tokenReceipt.status).to.be.eq(true);
      expect(receipts.crowdsaleReceipt.status).to.be.eq(true);

      // approve all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.approve(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(success => {
        // send tokens directly to Crowdsale contract address
        web3.eth.sendTransaction({ from: investor1, to: receipts.crowdsaleReceipt.contractAddress, gas: 4712388, value: web3.utils.toWei('0.02', 'ether') }).then(receipt => {
          expect(receipt.status).to.be.eq(true);

          // check token balance after investment
          icoApi.getTokenBalance(tokenInstance, investor1).then(actualTokenBalance => {
            expect(parseInt(actualTokenBalance)).to.be.eq(20);
            done();
          }).catch(e => {
            done(new Error(e));
          });
        }).catch(e => {
          done(new Error(e));
        });
      }).catch((e) => {
        done(new Error(e));
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('TCACrowdsale invest - using buyTokens', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('10', 'ether'), icoMaker];
    icoApi.deployTCACrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {
      expect(receipts.tokenReceipt.status).to.be.eq(true);
      expect(receipts.crowdsaleReceipt.status).to.be.eq(true);

      // approve all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.approve(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(receipt => {
        expect(receipt.status).to.be.eq(true);

        // wait 2 seconds before first investment
        let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
        delay(2000).then(() => {
          // call buyTokens function of Crowdsale contract
          let contractInstance = new web3.eth.Contract(TCACrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
          contractInstance.methods.buyTokens(investor1).send({ from: investor1, gas: 4712388, value: web3.utils.toWei('0.02', 'ether') }).then(receipt => {
            expect(receipt.status).to.be.eq(true);

            // check token balance after investment
            icoApi.getTokenBalance(tokenInstance, investor1).then(actualTokenBalance => {
              expect(parseInt(actualTokenBalance)).to.be.eq(20);
              done();
            }).catch(e => {
              done(new Error(e));
            });
          }).catch(e => {
            done(new Error(e));
          });
        });
      }).catch((e) => {
        done(new Error(e));
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('TCACrowdsale invest - using sendTransaction', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('10', 'ether'), icoMaker];
    icoApi.deployTCACrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {
      expect(receipts.tokenReceipt.status).to.be.eq(true);
      expect(receipts.crowdsaleReceipt.status).to.be.eq(true);

      // approve all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.approve(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(receipt => {
        expect(receipt.status).to.be.eq(true);

        // wait two seconds before first investment
        let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
        delay(2000).then(() => {
          // send tokens directly to Crowdsale contract address
          web3.eth.sendTransaction({ from: investor1, to: receipts.crowdsaleReceipt.contractAddress, gas: 4712388, value: web3.utils.toWei('0.02', 'ether') }).then(r => {
            // check token balance after investment
            icoApi.getTokenBalance(tokenInstance, investor1).then(actualTokenBalance => {
              expect(parseInt(actualTokenBalance)).to.be.eq(20);
              done();
            }).catch(e => {
              done(new Error(e));
            });
          }).catch(e => {
            done(new Error(e));
          });
        });
      }).catch((e) => {
        done(new Error(e));
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale contructor - invalid opening time', (done) => {
    let openingTime = Math.round((new Date().getTime() - 10000) / 1000); // 10 seconds in the past
    let crowdsaleArgs = [openingTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.01', 'ether'), web3.utils.toWei('0.003', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(() => {
      done(new Error('CARPDCrowdsale deployed with invalid opening time.'));
    }).catch(() => {
      expect(true).to.be.eq(true);
      done();
    });
  });

  it('CARPDCrowdsale contructor - invalid closing time', (done) => {
    let closingTime = startTime;
    let crowdsaleArgs = [startTime, closingTime, 1000, icoMaker, null, web3.utils.toWei('0.01', 'ether'), web3.utils.toWei('0.003', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(() => {
      done(new Error('CARPDCrowdsale deployed with invalid closing time.'));
    }).catch(() => {
      expect(true).to.be.eq(true);
      done();
    });
  });

  it('CARPDCrowdsale contructor - invalid rate', (done) => {
    let crowdsaleArgs = [startTime, endTime, 0, icoMaker, null, web3.utils.toWei('0.01', 'ether'), web3.utils.toWei('0.003', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(() => {
      done(new Error('CARPDCrowdsale deployed with invalid rate (0).'));
    }).catch(() => {
      expect(true).to.be.eq(true);
      done();
    });
  });

  it('CARPDCrowdsale (Crowdsale) - token()', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.01', 'ether'), web3.utils.toWei('0.003', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {
      let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
      contractInstance.methods.token().call().then(tokenAddress => {
        expect(tokenAddress).to.be.eq(receipts.tokenReceipt.contractAddress);
        done();
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (Crowdsale) - wallet()', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.01', 'ether'), web3.utils.toWei('0.003', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {
      let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
      contractInstance.methods.wallet().call().then(wallet => {
        expect(wallet).to.be.eq(icoMaker);
        done();
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (Crowdsale) - rate()', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.01', 'ether'), web3.utils.toWei('0.003', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {
      let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
      contractInstance.methods.rate().call().then(rate => {
        expect(rate).to.be.eq('1000');
        done();
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (Crowdsale) - weiRaised()', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.01', 'ether'), web3.utils.toWei('0.003', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {

      // approve all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.approve(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(() => {

        // wait two seconds before first investment
        let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
        delay(2000).then(() => {

          // check wei raised before investment
          let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
          contractInstance.methods.weiRaised().call().then(weiRaised => {
            expect(weiRaised).to.be.eq('0');

            // call buyTokens function of Crowdsale contract
            contractInstance.methods.buyTokens(investor1).send({ from: investor1, gas: 4712388, value: web3.utils.toWei('0.004', 'ether') }).then(() => {

              // check wei raised after investment
              contractInstance.methods.weiRaised().call().then(weiRaised => {
                expect(weiRaised).to.be.eq(web3.utils.toWei('0.004', 'ether'));
                done();
              }).catch(e => {
                done(new Error(e));
              });
            }).catch(e => {
              done(new Error(e));
            });
          }).catch((e) => {
            done(new Error(e));
          });
        });
      }).catch((e) => {
        done(new Error(e));
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (Crowdsale) - buyTokens() and withdrawTokens()', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.01', 'ether'), web3.utils.toWei('0.003', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {
      expect(receipts.tokenReceipt.status).to.be.eq(true);
      expect(receipts.crowdsaleReceipt.status).to.be.eq(true);

      // approve all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.approve(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(receipt => {
        expect(receipt.status).to.be.eq(true);

        // wait two seconds before first investment
        let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
        delay(2000).then(() => {
          // call buyTokens function of Crowdsale contract
          let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
          contractInstance.methods.buyTokens(investor1).send({ from: investor1, gas: 4712388, value: web3.utils.toWei('0.004', 'ether') }).then(receipt => {
            expect(receipt.status).to.be.eq(true);

            // check token balance after investment, should be 0 before finalization is called
            icoApi.getTokenBalance(tokenInstance, investor1).then(actualTokenBalance => {
              expect(parseInt(actualTokenBalance)).to.be.eq(0);

              // wait 6 seconds so that crowdsale is closed (timed crowdsale)
              let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
              delay(6000).then(() => {
                // finalize sale after goal is reached, anyone can call
                contractInstance.methods.finalize().send({ from: investor1 }).then(receipt => {
                  expect(receipt.status).to.be.eq(true);

                  // withdraw tokens, anyone can call
                  contractInstance.methods.withdrawTokens(investor1).send({ from: investor1 }).then(receipt => {
                    expect(receipt.status).to.be.eq(true);

                    // check token balance after investment, should be 200 after finalization and withdrawal
                    icoApi.getTokenBalance(tokenInstance, investor1).then(actualTokenBalance => {
                      expect(parseInt(actualTokenBalance)).to.be.eq(4);
                      done();
                    });
                  }).catch(e => {
                    done(new Error(e));
                  });
                }).catch(e => {
                  done(new Error(e));
                });
              });
            }).catch(e => {
              done(new Error(e));
            });
          }).catch(e => {
            done(new Error(e));
          });
        });
      }).catch((e) => {
        done(new Error(e));
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (Crowdsale) - fallback function and withdrawTokens()', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.01', 'ether'), web3.utils.toWei('0.003', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {
      expect(receipts.tokenReceipt.status).to.be.eq(true);
      expect(receipts.crowdsaleReceipt.status).to.be.eq(true);

      // approve all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.approve(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(receipt => {
        expect(receipt.status).to.be.eq(true);

        // wait two seconds before first investment
        let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
        delay(2000).then(() => {
          // send tokens directly to Crowdsale contract address
          web3.eth.sendTransaction({ from: investor1, to: receipts.crowdsaleReceipt.contractAddress, gas: 4712388, value: web3.utils.toWei('0.004', 'ether') }).then(r => {
            expect(receipt.status).to.be.eq(true);

            // check token balance after investment, should be 0 before finalization is called
            icoApi.getTokenBalance(tokenInstance, investor1).then(actualTokenBalance => {
              expect(parseInt(actualTokenBalance)).to.be.eq(0);

              // wait 6 seconds so that crowdsale is closed (timed crowdsale)
              let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
              delay(6000).then(() => {
                // finalize sale after goal is reached, anyone can call
                let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
                contractInstance.methods.finalize().send({ from: investor1 }).then(receipt => {
                  expect(receipt.status).to.be.eq(true);

                  // withdraw tokens, anyone can call
                  contractInstance.methods.withdrawTokens(investor1).send({ from: investor1 }).then(receipt => {
                    expect(receipt.status).to.be.eq(true);

                    // check token balance after investment, should be 200 after finalization and withdrawal
                    icoApi.getTokenBalance(tokenInstance, investor1).then(actualTokenBalance => {
                      expect(parseInt(actualTokenBalance)).to.be.eq(4);
                      done();
                    });
                  }).catch(e => {
                    done(new Error(e));
                  });
                }).catch(e => {
                  done(new Error(e));
                });
              });
            }).catch(e => {
              done(new Error(e));
            });
          }).catch(e => {
            done(new Error(e));
          });
        });
      }).catch((e) => {
        done(new Error(e));
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (Capped) - cap()', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.2', 'ether'), web3.utils.toWei('0.1', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {
      let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
      contractInstance.methods.cap().call().then(cap => {
        expect(cap).to.be.eq(web3.utils.toWei('0.2', 'ether'));
        done();
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (Capped) - capReached()', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.1', 'ether'), web3.utils.toWei('0.01', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {

      // approve all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.approve(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(() => {

        // wait two seconds before first investment
        let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
        delay(2000).then(() => {
          // invest less than a cap
          let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
          contractInstance.methods.buyTokens(investor1).send({ from: investor1, gas: 4712388, value: web3.utils.toWei('0.099999999', 'ether') }).then(() => {

            // should not reach cap 0.099999 < 0.1
            contractInstance.methods.capReached().call().then(capReached => {
              expect(capReached).to.be.eq(false);

              // invest just a little bit to reach cap (to be equal to cap)
              contractInstance.methods.buyTokens(investor2).send({ from: investor2, gas: 4712388, value: web3.utils.toWei('0.000000001', 'ether') }).then(() => {

                // should reach cap 0.1 == 0.1
                contractInstance.methods.capReached().call().then(capReached => {
                  expect(capReached).to.be.eq(true);
                  done();
                });
              });
            }).catch(e => {
              done(new Error(e));
            });
          }).catch(e => {
            done(new Error(e));
          });
        });
      }).catch((e) => {
        done(new Error(e));
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (Capped) - invest when cap reached', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.1', 'ether'), web3.utils.toWei('0.01', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {

      // approve all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.approve(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(receipt => {

        // wait two seconds before first investment
        let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
        delay(2000).then(() => {
          // invest and reach cap
          let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
          contractInstance.methods.buyTokens(investor3).send({ from: investor3, gas: 4712388, value: web3.utils.toWei('0.1', 'ether') }).then(() => {

            // invest just a little bit more, should reject
            contractInstance.methods.buyTokens(investor2).send({ from: investor2, gas: 4712388, value: web3.utils.toWei('0.000000001', 'ether') }).then(() => {
              done(new Error('Cap reached, but crowdsale still active'));
            }).catch(e => {
              expect(true).to.be.eq(true);
              done();
            });
          }).catch(e => {
            done(new Error(e));
          });
        });
      }).catch((e) => {
        done(new Error(e));
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (Allowance) - tokenWallet()', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.1', 'ether'), web3.utils.toWei('0.1', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {
      let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
      contractInstance.methods.tokenWallet().call().then(walletAddress => {
        expect(walletAddress).to.be.eq(icoMaker);
        done();
      }).catch(e => {
        done(new Error(e));
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (Allowance) - remainingTokens()', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.1', 'ether'), web3.utils.toWei('0.1', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {
      expect(receipts.tokenReceipt.status).to.be.eq(true);
      expect(receipts.crowdsaleReceipt.status).to.be.eq(true);

      // approve all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.approve(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(receipt => {
        expect(receipt.status).to.be.eq(true);

        // wait two seconds before first investment
        let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
        delay(2000).then(() => {

          // check remaining tokens before investments
          let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
          contractInstance.methods.remainingTokens().call().then(remainingTokens => {
            expect(remainingTokens).to.be.eq(new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString());

            // buy half the tokens
            contractInstance.methods.buyTokens(investor1).send({ from: investor1, gas: 4712388, value: web3.utils.toWei('0.05', 'ether') }).then(receipt => {

              // check remaining tokens after investment
              // NOTE: since it's post delivery, remaining tokens is the same,
              // so this function doesn't make sense much
              let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
              contractInstance.methods.remainingTokens().call().then(remainingTokens => {
                expect(remainingTokens).to.be.eq(new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString());
                done();
              });
            });
          }).catch(e => {
            done(new Error(e));
          });
        });
      }).catch((e) => {
        done(new Error(e));
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (Refundable) - goal()', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.2', 'ether'), web3.utils.toWei('0.1', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {
      let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
      contractInstance.methods.goal().call().then(goal => {
        expect(goal).to.be.eq(web3.utils.toWei('0.1', 'ether'));
        done();
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (Refundable) - goalReached()', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.1', 'ether'), web3.utils.toWei('0.01', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {

      // approve all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.approve(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(receipt => {

        // wait two seconds before first investment
        let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
        delay(2000).then(() => {
          // invest less than a goal
          let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
          contractInstance.methods.buyTokens(investor1).send({ from: investor1, gas: 4712388, value: web3.utils.toWei('0.0099999999', 'ether') }).then(() => {

            // should not reach goal 0.0099999 < 0.01
            contractInstance.methods.goalReached().call().then(goalReached => {
              expect(goalReached).to.be.eq(false);

              // invest just a little bit to reach goal (to be equal to goal)
              contractInstance.methods.buyTokens(investor2).send({ from: investor2, gas: 4712388, value: web3.utils.toWei('0.0000000001', 'ether') }).then(() => {

                // should reach goal 0.01 == 0.01
                contractInstance.methods.goalReached().call().then(goalReached => {
                  expect(goalReached).to.be.eq(true);
                  done();
                });
              });
            }).catch(e => {
              done(new Error(e));
            });
          }).catch(e => {
            done(new Error(e));
          });
        });
      }).catch((e) => {
        done(new Error(e));
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (Refundable) - claimRefund()', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.1', 'ether'), web3.utils.toWei('0.07', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {

      // approve all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.approve(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(receipt => {

        // check ETH balance before investment
        icoApi.getEthBalance(investor1).then(ethBalanceBefore => {

          // wait two seconds before first investment
          let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
          delay(2000).then(() => {
            // call buyTokens function of Crowdsale contract, invest less than the goal
            let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
            contractInstance.methods.buyTokens(investor1).send({ from: investor1, gas: 4712388, value: web3.utils.toWei('0.05', 'ether') }).then(() => {

              // check ETH balance after investment
              icoApi.getEthBalance(investor1).then(ethBalanceMid => {
                expect(ethBalanceBefore - ethBalanceMid - 0.05).to.be.lessThan(0.0025); // just 1 tx fee

                // wait 6 seconds so that crowdsale is closed (timed crowdsale)
                let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
                delay(6000).then(() => {
                  // finalize sale after goal is reached, anyone can call
                  contractInstance.methods.finalize().send({ from: investor1 }).then(() => {

                    // withdraw tokens, anyone can call
                    contractInstance.methods.claimRefund(investor1).send({ from: investor1 }).then(() => {

                      // check token balance after investment, should be 0 after finalization and withdrawal since goal not met
                      icoApi.getTokenBalance(tokenInstance, investor1).then(actualTokenBalance => {
                        expect(parseInt(actualTokenBalance)).to.be.eq(0);

                        // check ETH balance after refund, should have the same as balance before minus 2 tx fees
                        icoApi.getEthBalance(investor1).then(ethBalanceAfter => {
                          expect(ethBalanceBefore - ethBalanceAfter).to.be.lessThan(0.005); // just 2 tx fees
                          done();
                        });
                      });
                    });
                  });
                });
              }).catch(e => {
                done(new Error(e));
              });
            }).catch(e => {
              done(new Error(e));
            });
          });
        }).catch((e) => {
          done(new Error(e));
        });
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (Refundable) - claimRefund() when not finalized', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.01', 'ether'), web3.utils.toWei('0.003', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {

      // approve all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.approve(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(receipt => {

        // wait two seconds before first investment
        let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
        delay(2000).then(() => {
          // call buyTokens function of Crowdsale contract, invest less than the goal
          let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
          contractInstance.methods.buyTokens(investor1).send({ from: investor1, gas: 4712388, value: web3.utils.toWei('0.002', 'ether') }).then(() => {

            // try to claim refund while crowdsale not finalized
            contractInstance.methods.claimRefund(investor1).send({ from: investor1 }).then(receipt => {
              done(new Error('Refund successfuly claimed when crowdsale not finalized.'));
            }).catch(e => {
              expect(true).to.be.eq(true);
              done();
            });
          }).catch(e => {
            done(new Error(e));
          });
        });
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (Refundable) - claimRefund() when finalized and goal reached', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.01', 'ether'), web3.utils.toWei('0.003', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {

      // approve all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.approve(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(receipt => {

        // wait two seconds before first investment
        let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
        delay(2000).then(() => {
          // call buyTokens function of Crowdsale contract, invest more than the goal
          let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
          contractInstance.methods.buyTokens(investor1).send({ from: investor1, gas: 4712388, value: web3.utils.toWei('0.004', 'ether') }).then(() => {

            // wait 6 seconds so that crowdsale is closed (timed crowdsale)
            let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
            delay(6000).then(() => {
              // finalize sale after goal is reached, anyone can call
              contractInstance.methods.finalize().send({ from: investor1 }).then(() => {

                // try to claim refund while crowdsale not finalized
                contractInstance.methods.claimRefund(investor1).send({ from: investor1 }).then(() => {
                  done(new Error('Refund successfuly claimed when crowdsale finalized and goal reached.'));
                }).catch(e => {
                  expect(true).to.be.eq(true);
                  done();
                });
              }).catch(e => {
                done(new Error(e));
              });
            }).catch(e => {
              done(new Error(e));
            });
          }).catch(e => {
            done(new Error(e));
          });
        });
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (Finalizable) - finalize() and finalized()', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.01', 'ether'), web3.utils.toWei('0.003', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {

      // approve all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.approve(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(receipt => {

        // wait two seconds before first investment
        let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
        delay(2000).then(() => {
          // call buyTokens function of Crowdsale contract, invest more than the goal
          let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
          contractInstance.methods.buyTokens(investor1).send({ from: investor1, gas: 4712388, value: web3.utils.toWei('0.004', 'ether') }).then(() => {

            // expect crowdsale is not finalized
            contractInstance.methods.finalized().call().then(finalized => {
              expect(finalized).to.be.eq(false);

              // wait 6 seconds so that crowdsale is closed (timed crowdsale)
              let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
              delay(6000).then(() => {
                // finalize sale after goal is reached, anyone can call
                contractInstance.methods.finalize().send({ from: investor1 }).then(() => {
                  // expect crowsale to be finalized after finalize is called
                  contractInstance.methods.finalized().call().then(finalized => {
                    expect(finalized).to.be.eq(true);
                    done();
                  });
                }).catch(e => {
                  done(new Error(e));
                });
              }).catch(e => {
                done(new Error(e));
              });
            }).catch(e => {
              done(new Error(e));
            });
          }).catch(e => {
            done(new Error(e));
          });
        });
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (Finalizable) - finalize() when finalized', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.01', 'ether'), web3.utils.toWei('0.003', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {

      // approve all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.approve(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(receipt => {

        // wait two seconds before first investment
        let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
        delay(2000).then(() => {
          // call buyTokens function of Crowdsale contract, invest more than the goal
          let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
          contractInstance.methods.buyTokens(investor1).send({ from: investor1, gas: 4712388, value: web3.utils.toWei('0.004', 'ether') }).then(() => {

            // wait 6 seconds so that crowdsale is closed (timed crowdsale)
            let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
            delay(6000).then(() => {
              // finalize sale after goal is reached, anyone can call
              contractInstance.methods.finalize().send({ from: investor1 }).then(() => {
                // finalize sale after already finalized
                contractInstance.methods.finalize().send({ from: investor1 }).then(() => {
                  done(new Error('Finalize successfuly called on already finalized crowdsale.'));
                }).catch(e => {
                  expect(true).to.be.eq(true);
                  done();
                });
              }).catch(e => {
                done(new Error(e));
              });
            }).catch(e => {
              done(new Error(e));
            });
          }).catch(e => {
            done(new Error(e));
          });
        });
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (Finalizable) - finalize() when not closed', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.01', 'ether'), web3.utils.toWei('0.003', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {

      // approve all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.approve(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(receipt => {

        // wait two seconds before first investment
        let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
        delay(2000).then(() => {
          // call buyTokens function of Crowdsale contract, invest more than the goal
          let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
          contractInstance.methods.buyTokens(investor1).send({ from: investor1, gas: 4712388, value: web3.utils.toWei('0.004', 'ether') }).then(() => {

            // finalize when not closed (before end time)
            contractInstance.methods.finalize().send({ from: investor1 }).then(() => {
              done(new Error('Finalize successfuly called on open crowdsale (not yet closed).'));
            }).catch(e => {
              expect(true).to.be.eq(true);
              done();
            });
          }).catch(e => {
            done(new Error(e));
          });
        });
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (PostDelivery) - withdrawTokens() when not closed', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.01', 'ether'), web3.utils.toWei('0.003', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {

      // approve all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.approve(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(() => {

        // wait two seconds before first investment
        let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
        delay(2000).then(() => {
          // call buyTokens function of Crowdsale contract
          let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
          contractInstance.methods.buyTokens(investor1).send({ from: investor1, gas: 4712388, value: web3.utils.toWei('0.004', 'ether') }).then(() => {

            // withdraw tokens on open crowdsale (not yet closed)
            contractInstance.methods.withdrawTokens(investor1).send({ from: investor1 }).then(receipt => {
              done(new Error('Withdraw tokens successfuly called on open crowdsale (not yet closed).'));
            }).catch(e => {
              expect(true).to.be.eq(true);
              done();
            });
          }).catch(e => {
            done(new Error(e));
          });
        });
      }).catch((e) => {
        done(new Error(e));
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (PostDelivery) - withdrawTokens() when balance is 0', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.01', 'ether'), web3.utils.toWei('0.003', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {

      // approve all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.approve(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(() => {

        // wait two seconds before first investment
        let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
        delay(2000).then(() => {
          // call buyTokens function of Crowdsale contract
          let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
          contractInstance.methods.buyTokens(investor1).send({ from: investor1, gas: 4712388, value: web3.utils.toWei('0.004', 'ether') }).then(() => {

            // wait 6 seconds so that crowdsale is closed (timed crowdsale)
            let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
            delay(6000).then(() => {
              // withdraw tokens when balance is 0 (investor who did not participate)
              contractInstance.methods.withdrawTokens(investor2).send({ from: investor2 }).then(receipt => {
                done(new Error('Withdraw tokens successfuly called for non-participating investor.'));
              }).catch(e => {
                expect(true).to.be.eq(true);
                done();
              });
            });
          }).catch(e => {
            done(new Error(e));
          });
        });
      }).catch((e) => {
        done(new Error(e));
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (PostDelivery) - balanceOf()', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.01', 'ether'), web3.utils.toWei('0.003', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {

      // approve all tokens to crowdsale contract
      let tokenInstance = new web3.eth.Contract(TokenMintERC20TokenJSON.abi, receipts.tokenReceipt.contractAddress);
      tokenInstance.methods.approve(receipts.crowdsaleReceipt.contractAddress, new BigNumber(tokenArgs[3] * 10 ** tokenArgs[2]).toString()).send({ from: icoMaker }).then(() => {

        // wait two seconds before first investment
        let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
        delay(2000).then(() => {
          // call buyTokens function of Crowdsale contract
          let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
          contractInstance.methods.buyTokens(investor1).send({ from: investor1, gas: 4712388, value: web3.utils.toWei('0.004', 'ether') }).then(() => {

            // check balance for participating investor
            contractInstance.methods.balanceOf(investor1).call().then(balance => {
              expect(balance).to.be.eq(new BigNumber(4 * 10 ** tokenArgs[2]).toString());

              // check balance for non-participatin investor
              contractInstance.methods.balanceOf(investor2).call().then(balance => {
                expect(balance).to.be.eq('0');
                done();
              }).catch(e => {
                done(new Error(e));
              });
            }).catch(e => {
              done(new Error(e));
            });
          }).catch(e => {
            done(new Error(e));
          });
        });
      }).catch((e) => {
        done(new Error(e));
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (Timed) - openingTime() and closingTime()', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.01', 'ether'), web3.utils.toWei('0.003', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {

      // check opening time
      let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
      contractInstance.methods.openingTime().call().then(openingTime => {
        expect(openingTime).to.be.eq(startTime.toString());

        // check closing time
        contractInstance.methods.closingTime().call().then(closingTime => {
          expect(closingTime).to.be.eq(endTime.toString());
          done();
        });
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (Timed) - isOpen()', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.01', 'ether'), web3.utils.toWei('0.003', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {

      // call isOpen before opening time
      let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
      contractInstance.methods.isOpen().call().then(isOpen => {
        expect(isOpen).to.be.eq(false);

        // wait two seconds to get past opening time
        let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
        delay(2000).then(() => {
          // check is open after opening time
          contractInstance.methods.isOpen().call().then(isOpen => {
            expect(isOpen).to.be.eq(true);

            // wait 6 seconds so that crowdsale is closed (timed crowdsale)
            let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
            delay(6000).then(() => {
              // NOTE: finalize sale, this is needed because of ganache,
              // it returns empty string if write operation is not called.
              // Probably block times don't update because no mining
              contractInstance.methods.finalize().send({ from: investor1 }).then(() => {

                // check is open after closing time
                contractInstance.methods.isOpen().call().then(isOpen => {
                  expect(isOpen).to.be.eq(false);
                  done();
                }).catch(e => {
                  done(new Error(e));
                });
              }).catch(e => {
                done(new Error(e));
              });
            });
          }).catch(e => {
            done(new Error(e));
          });
        });
      }).catch((e) => {
        done(new Error(e));
      });
    }).catch(e => {
      done(new Error(e));
    });
  });

  it('CARPDCrowdsale (Timed) - hasClosed()', (done) => {
    let crowdsaleArgs = [startTime, endTime, 1000, icoMaker, null, web3.utils.toWei('0.01', 'ether'), web3.utils.toWei('0.003', 'ether'), icoMaker];
    icoApi.deployCARPDCrowdsale(icoMaker, tokenArgs, crowdsaleArgs).then(receipts => {

      // call isOpen before opening time
      let contractInstance = new web3.eth.Contract(CARPDCrowdsaleJSON.abi, receipts.crowdsaleReceipt.contractAddress);
      contractInstance.methods.hasClosed().call().then(hasClosed => {
        expect(hasClosed).to.be.eq(false);

        // wait two seconds to get past opening time
        let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
        delay(2000).then(() => {
          // check has closed after opening time
          contractInstance.methods.hasClosed().call().then(hasClosed => {
            expect(hasClosed).to.be.eq(false);

            // wait 6 seconds so that crowdsale is closed (timed crowdsale)
            let delay = ms => new Promise((resolve) => setTimeout(resolve, ms));
            delay(6000).then(() => {
              // NOTE: finalize sale, this is needed because of ganache,
              // it returns empty string if write operation is not called.
              // Probably block times don't update because no mining
              contractInstance.methods.finalize().send({ from: investor1 }).then(() => {

                // check has closed after closing time
                contractInstance.methods.hasClosed().call().then(hasClosed => {
                  expect(hasClosed).to.be.eq(true);
                  done();
                }).catch(e => {
                  done(new Error(e));
                });
              }).catch(e => {
                done(new Error(e));
              });
            });
          }).catch(e => {
            done(new Error(e));
          });
        });
      }).catch((e) => {
        done(new Error(e));
      });
    }).catch(e => {
      done(new Error(e));
    });
  });
});
