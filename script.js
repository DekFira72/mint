let provider, signer, stakingContract, tokenContract, userAddress;

async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("MetaMask tidak terdeteksi. Silakan install MetaMask.");
      return;
    }

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    userAddress = accounts[0];

    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();

    stakingContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);

    document.getElementById("walletStatus").innerText = "Wallet: " + userAddress;
    document.getElementById("connectBtn").innerText = "✅ Connected";

    updateStakeDisplay();
  } catch (err) {
    console.error("❌ Gagal connect wallet:", err);
    alert("Gagal koneksi wallet. Buka Console (F12) untuk lihat detail.");
  }
}

async function stake() {
  try {
    const input = document.getElementById("stakeInput");
    let amount = parseFloat(input.value);
    if (isNaN(amount) || amount <= 0) {
      alert("Masukkan jumlah yang valid.");
      return;
    }

    const decimals = await tokenContract.decimals();
    const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);

    const allowance = await tokenContract.allowance(userAddress, CONTRACT_ADDRESS);
    if (allowance.lt(amountInWei)) {
      const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, amountInWei);
      await approveTx.wait();
    }

    const stakeTx = await stakingContract.stake(amountInWei);
    await stakeTx.wait();

    alert("✅ Staking berhasil!");
    input.value = "";
    updateStakeDisplay();
  } catch (err) {
    console.error("❌ Error saat staking:", err);
    alert("Gagal staking.");
  }
}

async function unstake() {
  try {
    const tx = await stakingContract.unstake();
    await tx.wait();
    alert("✅ Unstake berhasil!");
    updateStakeDisplay();
  } catch (err) {
    console.error("❌ Gagal unstake:", err);
    alert("Gagal unstake.");
  }
}

async function updateStakeDisplay() {
  try {
    if (!stakingContract || !userAddress) return;

    const stakeAmount = await stakingContract.getStake(userAddress);
    const decimals = await tokenContract.decimals();
    const formatted = ethers.utils.formatUnits(stakeAmount, decimals);

    document.getElementById("stakeAmountDisplay").innerText = "Your Stake: " + formatted;
  } catch (err) {
    console.error("Error reading stake amount:", err);
  }
}

